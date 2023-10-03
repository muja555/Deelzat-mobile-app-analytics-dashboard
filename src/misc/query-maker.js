import {
    getFilterValue,
    isEmptyString,
    isEventHasItemsParam,
    isEventParamOfItems,
    isNumeric, isNumericEventParams,
    isNumericFilterValue
} from "./misc";
import moment from "moment";
import {FILTER_TYPES} from "../constants/filter-types.const";

const TABLE_NAME = 'deelzat-76871.analytics_297314224.events_*';

export function addDateRange(dateRange) {

    if (dateRange?.length !== 2) {
        return '';
    }

    const startDate =  moment(dateRange[0].getTime()).format('YMMDD');
    const endDate =  moment(dateRange[1].getTime()).format('YMMDD')

    return `AND _TABLE_SUFFIX BETWEEN '${startDate}' AND '${endDate}'`;
}


export function makeQueryOfAllUserProps() {
    return "SELECT\n" +
        "  user_properties.key AS user_properties_key,\n" +
        "FROM\n" +
        " `"+ TABLE_NAME + "`,\n" +
        "  UNNEST(user_properties) AS user_properties -- flatten our user properties \n" +
        "GROUP BY\n" +
        "  user_properties_key";
}



export function makeQueryOfAllEventNames() {
    return `
        SELECT
          DISTINCT event_name
        FROM
          \`${TABLE_NAME}\`
        WHERE
          event_name NOT LIKE 'TEST_%'
    `;
}



export function makeQueryOfAllEventNameParams(eventName) {
    return `
    SELECT DISTINCT
        event_name,
        eventParams.key as eventParamKey,
    FROM
        \`${TABLE_NAME}\`,
        UNNEST(event_params) as eventParams
    WHERE
        event_name = \"${eventName}\"
    `;
}



export function makeQueryOfEventParamValues(eventName, eventParam) {

    if (isEventHasItemsParam(eventName) && isEventParamOfItems(eventParam)) {
        return `
            SELECT
              item.${eventParam} as valueParam
            FROM
             \`${TABLE_NAME}\`,
              UNNEST(items) AS item
            WHERE 
                event_name = \'${eventName}\'
            GROUP BY
              valueParam
            LIMIT 10
        `;
    }
    else {
        return `
            SELECT
              event_param.key AS keyy, 
              event_param.value.string_value AS valueStr,
              event_param.value.double_value AS valueDouble,
              event_param.value.float_value AS valueFloat,
              event_param.value.int_value AS valueInt
            FROM
             \`${TABLE_NAME}\`,
              UNNEST(event_params) AS event_param
            WHERE 
                event_name = \'${eventName}\'
            AND 
                event_param.key = \'${eventParam}\'
            AND
                (event_param.value.string_value IS NOT NULL 
                OR event_param.value.double_value IS NOT NULL 
                OR event_param.value.float_value IS NOT NULL 
                OR event_param.value.int_value IS NOT NULL ) IS TRUE
            GROUP BY
              keyy,
              valueStr,
              valueDouble,
              valueFloat,
              valueInt
            LIMIT
                10        
        `;
    }
}



export function makeQueryOfAllUserPropValues(userProp) {
    return "SELECT\n" +
        "  user_properties.value.string_value AS user_properties_value,\n" +
        "FROM\n" +
        " `"+ TABLE_NAME + "`,\n" +
        "  UNNEST(user_properties) AS user_properties -- flatten our user properties \n" +
        "--WHERE\n" +
        "--  _table_suffix = '20181003' -- update to your desired start and end date\n" +
        "WHERE \n" +
        "    user_properties.key = '" + userProp + "'\n" +
        "GROUP BY\n" +
        "  user_properties_value\n" +
        "LIMIT 10"
}



export function makeQueryOfUserPropertyFilter(filter, dateRange) {
    return `
            SELECT * FROM (
                    SELECT DISTINCT user_id,
                    FIRST_VALUE(up.value.string_value) OVER (PARTITION BY user_id ORDER BY event_timestamp DESC) as string_value,
                    FROM \`${TABLE_NAME}\`,
                    unnest(event_params) as p, unnest(user_properties) as up
                    WHERE user_id IS NOT NULL AND up.key = '${filter.key}'
                    ${filter.filterUserPropInDateRange? addDateRange(dateRange): ''}
                    GROUP BY user_id, up.value.string_value, event_timestamp
            )
            WHERE ${isNumericFilterValue(filter)? "CAST (string_value AS NUMERIC)" : "string_value"} ${filter.op} ${getFilterValue(filter)}
    `;
}


export function makeQueryOfEventFilter(filter, dateRange) {

    if (isEventHasItemsParam(filter.key) && isEventParamOfItems(filter.subKey)) {

        const getCondition = () => {

            let conditionStatement = '';
            if (filter.key !== undefined) {
                conditionStatement = `
                    AND event_name = "${filter.key}"
                `;
            }
            if (filter.subKey !== undefined && filter.op !== undefined && filter.value !== undefined) {
                conditionStatement += `
                    AND item.${filter.subKey} ${filter.op} ${getFilterValue(filter)}
                `;
            }
            return conditionStatement;
        }

        return `
            SELECT
              DISTINCT user_id
            FROM
              \`${TABLE_NAME}\`,
              UNNEST(items) AS item
            WHERE
              user_id IS NOT NULL
              ${addDateRange(dateRange)}
              ${getCondition()}
    `;
    }
    else {

        const getCondition = () => {
            if (!isEmptyString(filter.subKey) && !isEmptyString(filter.op) && !isEmptyString(filter.value)) {

                let condition = `eventParams.value.string_value ${filter.op} '${filter.value}'`;
                if (isNumeric(filter.value)) {
                    condition = `( ${condition}
                                    OR eventParams.value.int_value ${filter.op} ${filter.value}
                                    OR eventParams.value.float_value ${filter.op}  ${filter.value}
                                    OR eventParams.value.double_value ${filter.op}  ${filter.value}
                                 ) IS TRUE
                    `;
                } else if (filter.subKey?.startsWith('is_')
                    && (filter.value === 'true' || filter.value === 'false')) {
                    condition = `( ${condition}
                                    OR eventParams.value.int_value ${filter.op} ${filter.value === 'true' ? 1 : 0}
                                 ) IS TRUE
                    `;
                }

                return `
                    AND eventParams.key = '${filter.subKey}'
                    AND ${condition} 
            `;
            }

            return '';
        }


        return `
            SELECT
              DISTINCT user_id,
            FROM
              \`${TABLE_NAME}\`,
              UNNEST(event_params) AS eventParams
            WHERE
              user_id IS NOT NULL
              AND event_name = "${filter.key}"
              ${addDateRange(dateRange)}
              ${getCondition()}
        `;
    }
}


export function makeQueryForSingleFilter(filter, dateRange) {

    if (filter.type === FILTER_TYPES.USER_PROP) {
        return makeQueryOfUserPropertyFilter(filter, dateRange);
    } else if (filter.type === FILTER_TYPES.EVENT) {
        return makeQueryOfEventFilter(filter, dateRange);
    }
}


export function makeQueryForSignleSegmentFilter(filter, segmentFilterBy, dateRange) {
    let query = makeQueryForSingleFilter(filter, dateRange);

    if (isEventHasItemsParam(filter.key) && isEventParamOfItems(segmentFilterBy)) {

        let combineWithItemId;
        if (segmentFilterBy === 'item_name') {
            combineWithItemId = `FORMAT('%s@@@%s', item.item_name, item.item_id) as valuee`
        }
        else {
            combineWithItemId = `item.${segmentFilterBy} as valuee`;
        }

        query = query.replaceAll(`DISTINCT user_id`, `DISTINCT event_timestamp, ${combineWithItemId}`);


        if (query.includes(`UNNEST(event_params) AS eventParams`)) {
            query = query.replaceAll(`UNNEST(event_params) AS eventParams`, `UNNEST(items) AS item, UNNEST(event_params) AS eventParams`);
        }
    } else {

        let fieldType = isNumericEventParams(segmentFilterBy)? 'double_value': 'string_value';
        query = query.replaceAll(`DISTINCT user_id`, `DISTINCT event_timestamp, eventParams.value.${fieldType} as valuee`);

        query = query + `
                 AND eventParams.key = '${segmentFilterBy}'
       `;

        if (query.includes(`UNNEST(items) AS item`)) {
            query = query.replaceAll(`UNNEST(items) AS item`, `UNNEST(items) AS item, UNNEST(event_params) AS eventParams`)
        }
    }

    return query;
}


export function makeQueryOfSegmentedFilters(filters, segmentFilterBy, dateRange, limit) {

    const queries = filters.map((filter, index) => {
        const query = makeQueryForSignleSegmentFilter(filter, segmentFilterBy, dateRange);
        return `${index === 0? 'WITH': ''} FILTER_${index} AS (${query})${index !== filters.length - 1? ',': ''}`;
    }).join('');


    const innerJoinFrom = filters.map((_, index) => `FILTER_${index}`).join(', ');

    const innerJoinWhere = filters.length > 1 ?
        filters.slice(1).map((_, index) => `FILTER_0.event_timestamp = FILTER_${index + 1}.event_timestamp`): '';

    const innerJoinQuery = `
       SELECT 
            FILTER_0.event_timestamp, FILTER_0.valuee
        FROM
            ${innerJoinFrom}
        ${filters.length > 1? `WHERE`: ''}
        ${innerJoinWhere}
    `;


    return `
            ${queries}
  
            SELECT
                count(valuee) as cccount, valuee
            FROM (${innerJoinQuery})
                GROUP BY valuee
                ORDER BY cccount DESC
                LIMIT ${limit}
             `;
}


export function makeQueryOfChartFilters(filters, dateRange) {

    const queries = filters.map((filter, index) => {
        let query = makeQueryForSingleFilter(filter, dateRange);
        query = query.replaceAll(`DISTINCT user_id`, `DISTINCT event_timestamp,DATE(TIMESTAMP_MICROS(event_timestamp)) as valuee`);
        return `${index === 0? 'WITH': ''} FILTER_${index} AS (${query})${index !== filters.length - 1? ',': ''}`;
    }).join('');

    const innerJoinFrom = filters.map((_, index) => `FILTER_${index}`).join(', ');

    const innerJoinWhere = filters.length > 1 ?
        filters.slice(1).map((_, index) => `FILTER_0.event_timestamp = FILTER_${index + 1}.event_timestamp`): '';

    const innerJoinQuery = `
       SELECT 
            FILTER_0.event_timestamp, FILTER_0.valuee
        FROM
            ${innerJoinFrom}
        ${filters.length > 1? `WHERE`: ''}
        ${innerJoinWhere}
    `;


    return `
            ${queries}
            SELECT
                count(valuee) as cccount, valuee
            FROM (${innerJoinQuery})
                GROUP BY valuee
                ORDER BY valuee DESC
       `;
}


export function makeQueryOfUserProfiles(filters, dateRange) {

    const queries = filters.map((filter, index) => {

        const query = makeQueryForSingleFilter(filter, dateRange);
        return `${index === 0? 'WITH': ''} FILTER_${index} AS (${query}),`;
    }).join('');

    const queriesConditions = filters.map((_, index) => {
        return `
              AND up.value.string_value IN (SELECT user_id FROM FILTER_${index})
        `;
    }).join('');

    const profilesQuery = `
        ALL_PROFILES AS (
            SELECT user_properties AS profile, event_timestamp AS last_seen,
                up.value.string_value as user_id,
                RANK() OVER (PARTITION BY user_id ORDER BY event_timestamp DESC) AS rank
            FROM \`${TABLE_NAME}\`,
                UNNEST(user_properties) AS up
                WHERE up.key = 'user_id'
                ${queriesConditions}
        )
    `;

    return `
        ${queries}
        ${profilesQuery}
        
         SELECT profile, last_seen
         FROM ALL_PROFILES
         WHERE rank = 1 
         ORDER BY last_seen DESC
    `;
}


export function makeQueryAllEventsForUser(userId, dateRange, page = 0) {
    return `
            SELECT
              *
            FROM
              \`${TABLE_NAME}\`,
               unnest(user_properties) as up
            WHERE 
              user_id IS NOT NULL AND up.key = 'user_id'
              AND event_name != 'user_engagement'
              AND up.value.string_value = '${userId}'
              ${addDateRange(dateRange)}
            ORDER by 
                event_timestamp DESC
            LIMIT 150 OFFSET ${page}
    `;
}

