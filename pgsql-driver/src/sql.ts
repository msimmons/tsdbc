// sys.databases
export const SQL = {
CLIENT_INFO:
`select 
   pg_backend_pid() as pid,
   current_user as user_name,
   current_schema as schema_name, 
   version() as procid, 
   'foo' as app_name, 
   current_database() as db_name
`,
NAMESPACES: 
`select
   *
from
   pg_catalog.pg_namespace
`,
TABLES:
`select
   *
from
   pg_catalog.pg_tables
`,
VIEWS:
`select
   *
from
   pg_catalog.pg_views
`,
MATERIALIZED_VIEWS:
`select
   *
from
   pg_catalog.pg_matviews
`,
PROCEDURES:
`select
   specific_schema as schema,
   specific_name as name
from
   information_schema.routines
`,
SEQUENCES:
`select
   sequence_schema as schema,
   sequence_name as name
from
   information_schema.sequences
`,
COLUMNS:
`select
   table_schema as schema,
   table_name,
   column_name,
   ordinal_position as position,
   column_default,
   is_nullable,
   data_type,
   numeric_precision,
   numeric_scale,
   is_identity,
   is_generated,
   character_maximum_length as maxlen
from
   information_schema.columns
order by table_schema, table_name, ordinal_position
`,
PARAMETERS:
`select
   specific_schema as schema,
   specific_name as name,
   parameter_name,
   ordinal_position as position,
   parameter_mode as in_out,
   is_result,
   data_type,
   character_maximum_length as maxlen,
   numeric_precision,
   numeric_scale,
   parameter_default
from
   information_schema.parameters
order by specific_schema, specific_name, ordinal_position
`,
INDEX_COLUMNS:
`select
   n.nspname as schema,
   t.relname as table_name,
   i.relname as index_name,
   a.attname as column_name,
   ix.indisunique as is_unique,
   row_number() over (partition by n.nspname, t.relname, i.relname) as position
from
   pg_index ix
   join pg_class t on t.oid = ix.indrelid and t.relkind = 'r'
   join pg_namespace n on n.oid = t.relnamespace
   join pg_class i on i.oid = ix.indexrelid
   join pg_attribute a on a.attnum = ANY(ix.indkey) and a.attrelid = t.oid
`
}