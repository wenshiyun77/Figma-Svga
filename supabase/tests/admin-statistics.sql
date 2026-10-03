-- Run in a transaction: fixtures and usage events are fully rolled back.
begin;
do $$
declare
  key text; chosen jsonb;
  a jsonb; b jsonb; c jsonb; empty_page jsonb; n bigint; expected_rank bigint;
  v_date date := (timezone('Asia/Shanghai', now()))::date;
begin
  select coalesce(max(user_number),0) + 1 into n from public.svga_plugin_users;
  insert into public.svga_plugin_users(figma_user_id,user_number,display_name,last_heartbeat_at)
  values ('usage-test-a',n,'usage-test tie',now()),('usage-test-b',n+1,'usage-test tie',now()),('usage-test-c',n+2,'usage-test zero',null);
  insert into public.svga_plugin_daily_usage(figma_user_id,usage_date,open_count,svga_export_count,webp_export_count,gif_export_count,lottie_export_count,webm_export_count,pag_export_count)
  values ('usage-test-a',v_date-1,2000000000,2,3,4,5,6,7),
         ('usage-test-a',v_date,2000000000,11,0,0,0,0,0),
         ('usage-test-b',v_date,2000000000,38,0,0,0,0,0),
         ('usage-test-b',v_date-1,2000000000,0,0,0,0,0,0);
  update public.svga_plugin_daily_usage set figma_import_count=10,sequence_import_count=8 where figma_user_id='usage-test-a' and usage_date=v_date-1;
  a := public.svga_admin_user_statistics_page(v_date,now()-interval '90 seconds','history','usage-test-',false,'opens','desc',0,1);
  b := public.svga_admin_user_statistics_page(v_date,now()-interval '90 seconds','history','usage-test-',false,'opens','desc',1,1);
  c := public.svga_admin_user_statistics_page(v_date,now()-interval '90 seconds','history','usage-test-c',false,'opens','desc',0,50);
  empty_page := public.svga_admin_user_statistics_page(v_date,now()-interval '90 seconds','history','usage-test-',false,'opens','desc',50,1);
  assert (a->'users'->0->>'total_figma_import_count')::bigint=10, 'imports aggregate all dates';
  assert (a->'users'->0->>'total_sequence_import_count')::bigint=8, 'sequence imports aggregate all dates';
  for key in select unnest(array['figmaImports','sequenceImports','webp','gif','lottie','webm','pag']) loop
    chosen := public.svga_admin_user_statistics_page(v_date,now(),'history','usage-test-',false,key,'desc',0,1);
    assert chosen->'users'->0->>'figma_user_id'='usage-test-a', 'descending sort for ' || key;
    chosen := public.svga_admin_user_statistics_page(v_date,now(),'history','usage-test-',false,key,'asc',0,1);
    assert chosen->'users'->0->>'figma_user_id'<>'usage-test-a', 'ascending sort for ' || key;
  end loop;
  assert (a->>'total')::integer = 3, 'matched count includes zero-usage user';
  assert a->'users'->0->>'figma_user_id' = 'usage-test-a', 'ties have deterministic user-number ordering';
  assert b->'users'->0->>'figma_user_id' = 'usage-test-b', 'next page advances across ties';
  assert (a->'users'->0->>'total_open_count')::bigint = 4000000000, 'sum all dates without integer overflow';
  assert (a->'users'->0->>'total_export_count')::bigint = 38, 'all six successful export formats including PAG';
  assert a->'users'->0->>'open_rank' = b->'users'->0->>'open_rank', 'equal totals share rank';
  assert a->'users'->0->>'export_rank' = b->'users'->0->>'export_rank', 'equal export totals share rank';
  select count(*)+1 into expected_rank from public.svga_plugin_users u
    where coalesce((select sum(d.open_count) from public.svga_plugin_daily_usage d where d.figma_user_id=u.figma_user_id),0)>0;
  assert (c->'users'->0->>'open_rank')::bigint=expected_rank, 'search retains global competition rank including gaps';
  assert (c->'users'->0->>'total_export_count')::bigint=0, 'missing usage is zero';
  assert empty_page->'users'='[]'::jsonb and (empty_page->>'total')::int=3, 'empty page preserves total';
  c := public.svga_admin_user_statistics_page(v_date,now()-interval '90 seconds','daily','usage-test-',false,'exports','desc',0,50);
  assert (c->>'total')::int=2, 'daily filter excludes unrecorded day';
  assert (c->'users'->0->>'total_open_count')::bigint=4000000000, 'daily filter still reports lifetime';
  c := public.svga_admin_user_statistics_page(v_date,now()-interval '90 seconds','online','usage-test-',false,'opens','desc',0,50);
  assert (c->>'total')::int=2, 'online filter keeps current heartbeat semantics';
  c := public.svga_admin_user_statistics_page(v_date,now(),'history','# ' || n,false,'opens','desc',0,50);
  assert (c->>'total')::int=1, 'number search tolerates space after hash';
  c := public.svga_admin_user_statistics_page(v_date,now(),'history','usage-test%',false,'opens','desc',0,50);
  assert (c->>'total')::int=0, 'percent is literal, not wildcard';
  insert into public.svga_plugin_daily_usage(figma_user_id,usage_date,pag_export_count)
    values ('usage-test-c',v_date-10,50);
  c := public.svga_admin_user_statistics_page(v_date,now(),'history','usage-test-',false,'exports','desc',0,1);
  assert c->'users'->0->>'figma_user_id'='usage-test-c', 'exports leaderboard orders by successful exports, independent of opens';
  delete from public.svga_plugin_daily_usage where figma_user_id='usage-test-c';
  insert into public.svga_plugin_pro_subscriptions(figma_user_id,plan_type,expires_at)
    values ('usage-test-a','trial',now()+interval '1 day'),
           ('usage-test-b','monthly',now()-interval '1 day'),
           ('usage-test-c','permanent',null);
  c := public.svga_admin_user_statistics_page(v_date,now(),'history','usage-test-',true,'opens','desc',0,50);
  assert (c->>'total')::int=2, 'PRO filter includes active trial/permanent and excludes expired monthly';
  assert c->'users'->0->>'open_rank'=a->'users'->0->>'open_rank', 'PRO filter retains global rank';
  assert (c->'users'->1->>'open_rank')::bigint=expected_rank, 'zero-usage PRO retains global competition rank';
  perform public.record_svga_plugin_usage('usage-test-a','usage-test tie',null,1,'test','pag_export');
  assert (select pag_export_count=1 from public.svga_plugin_daily_usage where figma_user_id='usage-test-a' and usage_date=v_date), 'PAG event adds daily success';
  assert (select open_count=2000000000 from public.svga_plugin_daily_usage where figma_user_id='usage-test-a' and usage_date=v_date), 'PAG does not add an open';
  assert not has_function_privilege('anon','public.svga_admin_user_statistics_page(date,timestamptz,text,text,boolean,text,text,integer,integer)','execute'), 'anon denied';
  assert not has_function_privilege('authenticated','public.svga_admin_user_statistics_page(date,timestamptz,text,text,boolean,text,text,integer,integer)','execute'), 'signed-in nonadmin denied';
  assert has_function_privilege('service_role','public.svga_admin_user_statistics_page(date,timestamptz,text,text,boolean,text,text,integer,integer)','execute'), 'edge role allowed';
end;
$$;
rollback;
