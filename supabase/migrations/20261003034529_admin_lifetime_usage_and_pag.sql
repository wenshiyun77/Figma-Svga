-- Lifetime totals use existing daily aggregates, never raw events or a client-wide fetch.
alter table public.svga_plugin_daily_usage
  add column if not exists pag_export_count integer not null default 0 check (pag_export_count >= 0);

-- Preserve the deployed Beijing-day, heartbeat, and first-user numbering semantics.
CREATE OR REPLACE FUNCTION public.record_svga_plugin_usage(p_figma_user_id text, p_display_name text, p_photo_url text, p_session_id bigint, p_plugin_version text, p_event text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_now timestamptz := now();
  v_date date := (timezone('Asia/Shanghai', v_now))::date;
  v_effective_event text := p_event;
  v_has_open_today boolean := false;
  v_next_user_number bigint;
begin
  if p_figma_user_id is null or char_length(p_figma_user_id) not between 1 and 256 then
    raise exception 'invalid figma user id';
  end if;
  if p_event is not null and p_event not in ('plugin_open','figma_import','svga_export','webp_export','gif_export','lottie_export','webm_export','pag_export','sequence_import') then
    raise exception 'invalid usage event';
  end if;

  if p_event is null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_figma_user_id || ':' || v_date::text, 0));
    select exists(
      select 1
      from public.svga_plugin_daily_usage
      where figma_user_id = p_figma_user_id
        and usage_date = v_date
        and open_count > 0
    ) into v_has_open_today;
    if not v_has_open_today then
      v_effective_event := 'plugin_open';
    end if;
  end if;

  update public.svga_plugin_users
  set display_name = left(coalesce(nullif(p_display_name, ''), 'Anonymous'), 256),
      photo_url = case when p_photo_url is null then null else left(p_photo_url, 2048) end,
      last_seen_at = v_now,
      last_opened_at = case when v_effective_event = 'plugin_open' then v_now else last_opened_at end,
      last_heartbeat_at = v_now,
      last_session_id = greatest(coalesce(p_session_id, 0), 0),
      plugin_version = left(coalesce(p_plugin_version, ''), 64)
  where figma_user_id = p_figma_user_id;

  if not found then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('svga_plugin_user_number_allocator', 0));

    update public.svga_plugin_users
    set display_name = left(coalesce(nullif(p_display_name, ''), 'Anonymous'), 256),
        photo_url = case when p_photo_url is null then null else left(p_photo_url, 2048) end,
        last_seen_at = v_now,
        last_opened_at = case when v_effective_event = 'plugin_open' then v_now else last_opened_at end,
        last_heartbeat_at = v_now,
        last_session_id = greatest(coalesce(p_session_id, 0), 0),
        plugin_version = left(coalesce(p_plugin_version, ''), 64)
    where figma_user_id = p_figma_user_id;

    if not found then
      select coalesce(max(user_number), 0) + 1
      into v_next_user_number
      from public.svga_plugin_users;

      insert into public.svga_plugin_users(
        figma_user_id, user_number, display_name, photo_url,
        first_seen_at, last_seen_at, last_opened_at, last_heartbeat_at,
        last_session_id, plugin_version
      ) values (
        p_figma_user_id,
        v_next_user_number,
        left(coalesce(nullif(p_display_name, ''), 'Anonymous'), 256),
        case when p_photo_url is null then null else left(p_photo_url, 2048) end,
        v_now,
        v_now,
        case when v_effective_event = 'plugin_open' then v_now else null end,
        v_now,
        greatest(coalesce(p_session_id, 0), 0),
        left(coalesce(p_plugin_version, ''), 64)
      )
      on conflict(figma_user_id) do update
      set display_name = excluded.display_name,
          photo_url = excluded.photo_url,
          last_seen_at = excluded.last_seen_at,
          last_opened_at = case when v_effective_event = 'plugin_open' then v_now else public.svga_plugin_users.last_opened_at end,
          last_heartbeat_at = v_now,
          last_session_id = excluded.last_session_id,
          plugin_version = excluded.plugin_version;
    end if;
  end if;

  if v_effective_event is null then
    return;
  end if;

  insert into public.svga_plugin_daily_usage(
    figma_user_id, usage_date, open_count, figma_import_count, svga_export_count,
    webp_export_count, gif_export_count, lottie_export_count, webm_export_count, pag_export_count,
    sequence_import_count, first_seen_at, last_seen_at
  ) values (
    p_figma_user_id,
    v_date,
    case when v_effective_event = 'plugin_open' then 1 else 0 end,
    case when v_effective_event = 'figma_import' then 1 else 0 end,
    case when v_effective_event = 'svga_export' then 1 else 0 end,
    case when v_effective_event = 'webp_export' then 1 else 0 end,
    case when v_effective_event = 'gif_export' then 1 else 0 end,
    case when v_effective_event = 'lottie_export' then 1 else 0 end,
    case when v_effective_event = 'webm_export' then 1 else 0 end,
    case when v_effective_event = 'pag_export' then 1 else 0 end,
    case when v_effective_event = 'sequence_import' then 1 else 0 end,
    v_now,
    v_now
  )
  on conflict(figma_user_id, usage_date) do update
  set open_count = public.svga_plugin_daily_usage.open_count + excluded.open_count,
      figma_import_count = public.svga_plugin_daily_usage.figma_import_count + excluded.figma_import_count,
      svga_export_count = public.svga_plugin_daily_usage.svga_export_count + excluded.svga_export_count,
      webp_export_count = public.svga_plugin_daily_usage.webp_export_count + excluded.webp_export_count,
      gif_export_count = public.svga_plugin_daily_usage.gif_export_count + excluded.gif_export_count,
      lottie_export_count = public.svga_plugin_daily_usage.lottie_export_count + excluded.lottie_export_count,
      webm_export_count = public.svga_plugin_daily_usage.webm_export_count + excluded.webm_export_count,
      pag_export_count = public.svga_plugin_daily_usage.pag_export_count + excluded.pag_export_count,
      sequence_import_count = public.svga_plugin_daily_usage.sequence_import_count + excluded.sequence_import_count,
      last_seen_at = excluded.last_seen_at;
end;
$function$
;
revoke all on function public.record_svga_plugin_usage(text,text,text,bigint,text,text) from public, anon, authenticated;
grant execute on function public.record_svga_plugin_usage(text,text,text,bigint,text,text) to service_role;

create or replace function public.svga_admin_user_usage_page(
  p_date date, p_online_since timestamptz, p_mode text default 'online',
  p_query text default '', p_pro_only boolean default false,
  p_sort text default 'default', p_offset integer default 0, p_limit integer default 50
)
returns jsonb
language sql stable security invoker
set search_path = ''
as $$
  with totals as materialized (
    select u.*,
      coalesce(d.total_open_count, 0)::bigint as total_open_count,
      coalesce(d.total_export_count, 0)::bigint as total_export_count
    from public.svga_plugin_users u
    left join (
      select figma_user_id, sum(open_count)::bigint as total_open_count,
        sum(svga_export_count::bigint + webp_export_count + gif_export_count +
            lottie_export_count + webm_export_count + pag_export_count)::bigint as total_export_count
      from public.svga_plugin_daily_usage
      group by figma_user_id
    ) d using (figma_user_id)
  ), ranked as materialized (
    -- Global competition ranks: equal totals share rank (1,1,3).
    -- Compute before mode, search, PRO or page filtering.
    select totals.*, rank() over (order by total_open_count desc) as open_rank,
      rank() over (order by total_export_count desc) as export_rank
    from totals
  ), filtered as (
    select * from ranked r
    where (p_mode <> 'online' or r.last_heartbeat_at >= p_online_since)
      and (p_mode <> 'daily' or exists (
        select 1 from public.svga_plugin_daily_usage d
        where d.figma_user_id = r.figma_user_id and d.usage_date = p_date
      ))
      and (not p_pro_only or exists (
        select 1 from public.svga_plugin_pro_subscriptions s
        where s.figma_user_id = r.figma_user_id and
          (s.plan_type = 'permanent' or
           (s.plan_type in ('trial','monthly') and s.expires_at > now()))
      ))
      and (
        coalesce(p_query, '') = ''
        or case when p_query ~ '^#\s*[0-9]{1,18}$'
          then r.user_number = regexp_replace(p_query, '[^0-9]', '', 'g')::bigint
          -- Literal substring search: no PostgREST filter injection or wildcard surprises.
          else strpos(lower(r.display_name), lower(p_query)) > 0
            or strpos(lower(r.figma_user_id), lower(p_query)) > 0
        end
      )
  ), ordered as (
    select filtered.*, row_number() over (order by
      case when p_sort = 'opens' then total_open_count end desc nulls last,
      case when p_sort = 'exports' then total_export_count end desc nulls last,
      case when p_sort not in ('opens','exports') and p_mode = 'online' then last_heartbeat_at end desc nulls last,
      case when p_sort not in ('opens','exports') and p_mode = 'daily' then last_seen_at end desc nulls last,
      user_number asc nulls last, figma_user_id asc
    ) as page_order from filtered
  ), page as (
    select * from ordered order by page_order
    offset greatest(coalesce(p_offset, 0), 0)
    limit greatest(1, least(coalesce(p_limit, 50), 50))
  )
  select jsonb_build_object(
    'users', coalesce((select jsonb_agg(to_jsonb(page) - 'page_order' order by page_order) from page), '[]'::jsonb),
    'total', (select count(*) from filtered)
  );
$$;

revoke all on function public.svga_admin_user_usage_page(date,timestamptz,text,text,boolean,text,integer,integer) from public, anon, authenticated;
grant execute on function public.svga_admin_user_usage_page(date,timestamptz,text,text,boolean,text,integer,integer) to service_role;

