// sys.databases
export const SQL = {
CLIENT_INFO:
`select 
   @@spid as spid,
   user_name() as user_name,
   SCHEMA_NAME() as schema_name, 
   @@PROCID as procid, 
   APP_NAME() as app_name, 
   DB_NAME() as db_name
`,
NAMESPACES: 
`select
   name
from
   sys.schemas s
`,
OBJECTS:
`select
   object_id,
   name,
   type,
   SCHEMA_NAME(schema_id) as namespace
from
   sys.all_objects
where type in ('S', 'U', 'IT', 'V', 'P', 'FN', 'SO')
`,
SYNONYMS:
`select
   object_id,
   name,
   SCHEMA_NAME(schema_id) as namespace,
   base_object_name as target_name
from
   sys.synonyms
`,
COLUMNS:
`select
   c.object_id,
   c.column_id,
   c.name,
   t.name as type_name,
   c.max_length,
   c.precision,
   c.scale,
   c.is_nullable
from
   sys.all_columns c
   join sys.types t on t.user_type_id = c.user_type_id
order by c.object_id, c.column_id
`,
PARAMETERS:
`select
   p.object_id,
   p.name,
   p.parameter_id,
   t.name as type_name,
   p.max_length,
   p.precision,
   p.scale,
   p.is_output,
   p.is_cursor_ref,
   p.default_value
from
   sys.all_parameters p
   join sys.types t on t.user_type_id = p.user_type_id
order by p.object_id, p.parameter_id
`,
INDEX_COLUMNS:
`select
   i.object_id,
   i.name,
   i.is_unique,
   i.is_primary_key,
   i.is_unique_constraint,
   c.column_id,
   c.key_ordinal,
   c.is_descending_key
from
   sys.index_columns c
   join sys.indexes i on i.index_id = c.index_id and i.object_id = c.object_id
order by i.object_id, i.index_id, c.key_ordinal
`
}