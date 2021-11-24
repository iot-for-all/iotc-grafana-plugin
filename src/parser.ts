import { DateTime } from '@grafana/data';

/**
 * Returns the projected name of the timestamp field if it's in the attribute list.
 */
export function getTsFieldName(query: string) {
  const selectFromRegExp = /select\s+(?<attributes>.*)\s+from/gi; // SELECT <...> FROM
  const tsRegex = /^\s*\$ts\s*$/g; // $ts
  const tsAliasRegex = /^\s*\$ts\s+AS\s+(?<timeField>[^\s]*)\s*$/gi; // $ts AS <alias>
  const tsAggRegex = /^\s*(?<aggregator>[^s]*)\(\s*\$ts\s*\)\s*$/g; // min($ts)
  const tsAggAliasRegex = /^\s*(?<aggregator>[^s]*)\(\s*\$ts\s*\)\s+AS\s+(?<timeField>[^\s]*)\s*$/gi; // min($ts) AS <alias>

  const selectFromMatch = selectFromRegExp.exec(query);

  if (!selectFromMatch) {
    return null;
  }

  // Find the timestamp attribute
  for (const attributeMatch of selectFromMatch.groups!.attributes.split(',')) {
    const tsMatch = tsRegex.exec(attributeMatch);
    const tsAttributeAliasMatch = tsAliasRegex.exec(attributeMatch);
    const tsAggMatch = tsAggRegex.exec(attributeMatch);
    const tsAggAliasMatch = tsAggAliasRegex.exec(attributeMatch);

    if (tsMatch) {
      return '$ts';
    } else if (tsAttributeAliasMatch) {
      return tsAttributeAliasMatch.groups!.timeField;
    } else if (tsAggMatch) {
      return `${tsAggMatch.groups!.aggregator.toLowerCase()}_$ts`;
    } else if (tsAggAliasMatch) {
      return `${tsAggAliasMatch.groups!.aggregator.toLowerCase()}_${tsAggAliasMatch.groups!.timeField}`;
    }
  }

  return null;
}

/**
 * Overrides the query time window with a specific date interval.
 */
export function overrideTimeWindow(query: string, from: DateTime, to: DateTime) {
  const windowClause = `WITHIN_WINDOW('${from.toISOString()}/${to.toISOString()}')`;

  const whereMatch = query.match(/\s+WHERE\s+/gi);
  const groupByMatch = query.match(/\s+GROUP\s+BY\s+/gi);
  const orderByMatch = query.match(/\s+ORDER\s+BY\s+/gi);

  if (whereMatch) {
    return query.replace(whereMatch[0], ` WHERE ${windowClause} AND `);
  } else if (groupByMatch) {
    return query.replace(groupByMatch[0], ` WHERE ${windowClause} GROUP BY `);
  } else if (orderByMatch) {
    return query.replace(orderByMatch[0], ` WHERE ${windowClause} ORDER BY `);
  } else {
    return `${query} WHERE ${windowClause}`;
  }
}
