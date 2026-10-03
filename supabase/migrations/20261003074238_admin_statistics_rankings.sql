-- Detailed lifetime statistics in a separate, globally sorted list.
create or replace function public.svga_admin_user_statistics_page(
  p_date date, p_online_since timestamptz, p_mode text default 'online',
  p_query text default '', p_pro_only boolean default false,
  p_sort text default 'opens', p_sort_direction text default 'desc', p_offset integer default 0, p_limit integer default 50
)
returns jsonb
language sql stable security invoker
set search_path = ''
as $$
  with totals as materialized (
    select u.*,
      coalesce(d.total_open_count, 0)::bigint as total_open_count,
      coalesce(d.total_export_count, 0)::bigint as total_export_count,
      coalesce(d.total_figma_import_count, 0)::bigint as total_figma_import_count,
      coalesce(d.total_sequence_import_count, 0)::bigint as total_sequence_import_count,
      coalesce(d.total_svga_export_count, 0)::bigint as total_svga_export_count,
      coalesce(d.total_webp_export_count, 0)::bigint as total_webp_export_count,
      coalesce(d.total_gif_export_count, 0)::bigint as total_gif_export_count,
      coalesce(d.total_lottie_export_count, 0)::bigint as total_lottie_export_count,
      coalesce(d.total_webm_export_count, 0)::bigint as total_webm_export_count,
      coalesce(d.total_pag_export_count, 0)::bigint as total_pag_export_count
    from public.svga_plugin_users u
    left join (
      select figma_user_id, sum(open_count)::bigint as total_open_count,
        sum(svga_export_count::bigint + webp_export_count + gif_export_count +
            lottie_export_count + webm_export_count + pag_export_count)::bigint as total_export_count
      ,
        sum(figma_import_count::bigint)::bigint as total_figma_import_count,
        sum(sequence_import_count::bigint)::bigint as total_sequence_import_count,
        sum(svga_export_count::bigint)::bigint as total_svga_export_count,
        sum(webp_export_count::bigint)::bigint as total_webp_export_count,
        sum(gif_export_count::bigint)::bigint as total_gif_export_count,
        sum(lottie_export_count::bigint)::bigint as total_lottie_export_count,
        sum(webm_export_count::bigint)::bigint as total_webm_export_count,
        sum(pag_export_count::bigint)::bigint as total_pag_export_count
      from public.svga_plugin_daily_usage
      group by figma_user_id
    ) d using (figma_user_id)
  ), ranked as materialized (
    -- Global competition ranks: equal totals share rank (1,1,3).
    -- Compute before mode, search, PRO or page filtering.
    select totals.*, rank() over (order by
      case when p_sort = 'opens' and p_sort_direction = 'desc' then total_open_count end desc nulls last,
      case when p_sort = 'opens' and p_sort_direction = 'asc' then total_open_count end asc nulls last,
      case when p_sort = 'exports' and p_sort_direction = 'desc' then total_export_count end desc nulls last,
      case when p_sort = 'exports' and p_sort_direction = 'asc' then total_export_count end asc nulls last,
      case when p_sort = 'figmaImports' and p_sort_direction = 'desc' then total_figma_import_count end desc nulls last,
      case when p_sort = 'figmaImports' and p_sort_direction = 'asc' then total_figma_import_count end asc nulls last,
      case when p_sort = 'sequenceImports' and p_sort_direction = 'desc' then total_sequence_import_count end desc nulls last,
      case when p_sort = 'sequenceImports' and p_sort_direction = 'asc' then total_sequence_import_count end asc nulls last,
      case when p_sort = 'svga' and p_sort_direction = 'desc' then total_svga_export_count end desc nulls last,
      case when p_sort = 'svga' and p_sort_direction = 'asc' then total_svga_export_count end asc nulls last,
      case when p_sort = 'webp' and p_sort_direction = 'desc' then total_webp_export_count end desc nulls last,
      case when p_sort = 'webp' and p_sort_direction = 'asc' then total_webp_export_count end asc nulls last,
      case when p_sort = 'gif' and p_sort_direction = 'desc' then total_gif_export_count end desc nulls last,
      case when p_sort = 'gif' and p_sort_direction = 'asc' then total_gif_export_count end asc nulls last,
      case when p_sort = 'lottie' and p_sort_direction = 'desc' then total_lottie_export_count end desc nulls last,
      case when p_sort = 'lottie' and p_sort_direction = 'asc' then total_lottie_export_count end asc nulls last,
      case when p_sort = 'webm' and p_sort_direction = 'desc' then total_webm_export_count end desc nulls last,
      case when p_sort = 'webm' and p_sort_direction = 'asc' then total_webm_export_count end asc nulls last,
      case when p_sort = 'pag' and p_sort_direction = 'desc' then total_pag_export_count end desc nulls last,
      case when p_sort = 'pag' and p_sort_direction = 'asc' then total_pag_export_count end asc nulls last,
      case when p_sort = 'number' and p_sort_direction = 'desc' then user_number end desc nulls last,
      case when p_sort = 'number' and p_sort_direction = 'asc' then user_number end asc nulls last,
      case when p_sort = 'name' and p_sort_direction = 'desc' then lower(display_name) end desc nulls last,
      case when p_sort = 'name' and p_sort_direction = 'asc' then lower(display_name) end asc nulls last,
      case when p_sort = 'firstSeen' and p_sort_direction = 'desc' then first_seen_at end desc nulls last,
      case when p_sort = 'firstSeen' and p_sort_direction = 'asc' then first_seen_at end asc nulls last,
      case when p_sort = 'lastOpened' and p_sort_direction = 'desc' then last_opened_at end desc nulls last,
      case when p_sort = 'lastOpened' and p_sort_direction = 'asc' then last_opened_at end asc nulls last) as statistic_rank,
      rank() over (order by total_open_count desc) as open_rank,
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
      case when p_sort = 'opens' and p_sort_direction = 'desc' then total_open_count end desc nulls last,
      case when p_sort = 'opens' and p_sort_direction = 'asc' then total_open_count end asc nulls last,
      case when p_sort = 'exports' and p_sort_direction = 'desc' then total_export_count end desc nulls last,
      case when p_sort = 'exports' and p_sort_direction = 'asc' then total_export_count end asc nulls last,
      case when p_sort = 'figmaImports' and p_sort_direction = 'desc' then total_figma_import_count end desc nulls last,
      case when p_sort = 'figmaImports' and p_sort_direction = 'asc' then total_figma_import_count end asc nulls last,
      case when p_sort = 'sequenceImports' and p_sort_direction = 'desc' then total_sequence_import_count end desc nulls last,
      case when p_sort = 'sequenceImports' and p_sort_direction = 'asc' then total_sequence_import_count end asc nulls last,
      case when p_sort = 'svga' and p_sort_direction = 'desc' then total_svga_export_count end desc nulls last,
      case when p_sort = 'svga' and p_sort_direction = 'asc' then total_svga_export_count end asc nulls last,
      case when p_sort = 'webp' and p_sort_direction = 'desc' then total_webp_export_count end desc nulls last,
      case when p_sort = 'webp' and p_sort_direction = 'asc' then total_webp_export_count end asc nulls last,
      case when p_sort = 'gif' and p_sort_direction = 'desc' then total_gif_export_count end desc nulls last,
      case when p_sort = 'gif' and p_sort_direction = 'asc' then total_gif_export_count end asc nulls last,
      case when p_sort = 'lottie' and p_sort_direction = 'desc' then total_lottie_export_count end desc nulls last,
      case when p_sort = 'lottie' and p_sort_direction = 'asc' then total_lottie_export_count end asc nulls last,
      case when p_sort = 'webm' and p_sort_direction = 'desc' then total_webm_export_count end desc nulls last,
      case when p_sort = 'webm' and p_sort_direction = 'asc' then total_webm_export_count end asc nulls last,
      case when p_sort = 'pag' and p_sort_direction = 'desc' then total_pag_export_count end desc nulls last,
      case when p_sort = 'pag' and p_sort_direction = 'asc' then total_pag_export_count end asc nulls last,
      case when p_sort = 'number' and p_sort_direction = 'desc' then user_number end desc nulls last,
      case when p_sort = 'number' and p_sort_direction = 'asc' then user_number end asc nulls last,
      case when p_sort = 'name' and p_sort_direction = 'desc' then lower(display_name) end desc nulls last,
      case when p_sort = 'name' and p_sort_direction = 'asc' then lower(display_name) end asc nulls last,
      case when p_sort = 'firstSeen' and p_sort_direction = 'desc' then first_seen_at end desc nulls last,
      case when p_sort = 'firstSeen' and p_sort_direction = 'asc' then first_seen_at end asc nulls last,
      case when p_sort = 'lastOpened' and p_sort_direction = 'desc' then last_opened_at end desc nulls last,
      case when p_sort = 'lastOpened' and p_sort_direction = 'asc' then last_opened_at end asc nulls last,
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

revoke all on function public.svga_admin_user_statistics_page(date,timestamptz,text,text,boolean,text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.svga_admin_user_statistics_page(date,timestamptz,text,text,boolean,text,text,integer,integer) to service_role;

