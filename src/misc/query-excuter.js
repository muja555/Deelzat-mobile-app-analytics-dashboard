import {FILTER_TYPES} from "../constants/filter-types.const";
import {
    makeQueryAllEventsForUser,
    makeQueryOfUserProfiles,
    makeQueryOfAllEventNames,
    makeQueryOfAllUserProps,
    makeQueryOfAllUserPropValues,
    makeQueryOfEventParamValues, makeQueryOfSegmentedFilters, makeQueryOfChartFilters,
} from "./query-maker";
import {excuteQuery} from "./apis";
import {isUpper, processEventsResult} from "./misc";

const excludedProps = ['last_gclid', 'last_advertising_id_reset', 'ga_session_id', '_ltv_ILS', 'ga_session_number', 'country'];

export function getAllUserProps() {
    return new Promise((resolve, reject) => {
        const query = makeQueryOfAllUserProps();
        excuteQuery(query)
            .then(response => response.json())
            .then((rows = []) => {
                let _props = [];
                rows.forEach(row => {
                    const value = row['user_properties_key'];
                    if (!isUpper(value) && !excludedProps.includes(value)) {
                        _props = _props.concat(value);
                    }
                });
                resolve(_props);
            })
            .catch(reject);
    });
}


export function getAllEventNames() {
    return new Promise((resolve, reject) => {
        const query = makeQueryOfAllEventNames();
        excuteQuery(query)
            .then(response => response.json())
            .then((rows = []) => {
                let _props = [];
                rows.forEach(row => {
                    const value = row['event_name'];
                    if (!isUpper(value)) {
                        _props = _props.concat(value);
                    }
                });
                resolve(_props);
            })
            .catch(reject);
    });
}



export function getPossibleValuesForFilter(filter = {}) {
    return new Promise((resolve, reject) => {

        if (filter?.type === FILTER_TYPES.USER_PROP) {
            const query = makeQueryOfAllUserPropValues(filter.key);
            excuteQuery(query)
                .then(response => response.json())
                .then((rows = []) => {
                    resolve(rows?.map(r => r['user_properties_value']));
                })
                .catch(reject);
        }
        else if (filter?.type === FILTER_TYPES.EVENT) {

            const query = makeQueryOfEventParamValues(filter.key, filter.subKey);
            excuteQuery(query)
                .then(response => response.json())
                .then((rows = []) => {

                    if (!rows?.length) {
                        resolve([]);
                    }
                    else if (!!rows[0]['valueParam']) {
                        resolve(rows.map(r => r['valueParam']));
                    }
                    else {

                        let columnName = rows[0]['valueStr'] !== null? 'valueStr'
                            : rows[0]['valueInt'] !== null? 'valueInt'
                                : rows[0]['valueFloat'] !== null? 'valueFloat'
                                  :  rows[0]['valueDouble'] !== null? 'valueDouble': '';

                        resolve(rows.map(r => r[columnName]));
                    }
                })
                .catch(reject);
        }
    });
}




export function queryFilterUserProfiles(filters = [], userProperties, dateRange) {
    return new Promise((resolve, reject) => {

        const allQ = makeQueryOfUserProfiles(filters, dateRange);

        console.log("query-excuter.js " + "dateRange:", dateRange)
        console.log("query-excuter.js " + "allQ", allQ)
        excuteQuery(allQ)
            .then(res => res.json())
            .then(rows => {
                return rows.map(row => {

                    let newRow = {
                        last_seen: row.last_seen
                    }

                    // map user properties to it's values
                    userProperties.forEach(property => {

                        const profileProps = row.profile.filter(prop => prop.key === property);

                        if (profileProps.length === 0) {
                            newRow[property] = property.startsWith('is_')? 'false': '';
                        }
                        else {
                            profileProps
                                .forEach(prop => {

                                    const value = !!prop.value['string_value'] ? prop.value['string_value'] :
                                        !!prop.value['int_value'] ? prop.value['int_value'] :
                                            !!prop.value['double_value'] ? prop.value['double_value'] :
                                                !!prop.value['float_value'] ? prop.value['float_value'] : '';

                                    // Set boolean properties with true or false
                                    if (property.startsWith('is_')) {
                                        if (!value) {
                                            newRow[property] = 'false';
                                        }
                                        else if (value === 1) {
                                            newRow[property] = 'true';
                                        }
                                        else {
                                            newRow[property] = value;
                                        }
                                    }
                                    else {
                                        newRow[property] = value;
                                    }
                                });
                        }
                    });


                    // move user_id to first
                    const userID = newRow['user_id'];
                    delete newRow['user_id'];
                    newRow = {
                        ['user_id']: userID,
                        ...newRow
                    };

                    return newRow;
                })
            })
            .then(resolve)
            .catch(reject);

    });
}


export function querySegmentedResultsOfEvent(filters, segmentFilterBy, dateRange, limit) {
    return new Promise((resolve, reject) => {

        const finalQuerery = makeQueryOfSegmentedFilters(filters, segmentFilterBy, dateRange, limit);

        console.log("query-excuter.js " + "dateRange:", dateRange)
        console.log("query-excuter.js " + "allQ", finalQuerery)

        excuteQuery(finalQuerery)
            .then(res => res.json())
            .then(resolve)
            .catch(reject);
    });
}


export function queryChartedResultsOfEvent(filters, dateRange) {
    return new Promise((resolve, reject) => {

        const finalQuerery = makeQueryOfChartFilters(filters, dateRange);

        console.log("query-excuter.js " + "dateRange:", dateRange)
        console.log("query-excuter.js " + "allQ", finalQuerery)

        excuteQuery(finalQuerery)
            .then(res => res.json())
            .then(resolve)
            .catch(reject);
    });
}


export function queryAllUserEvents(userId, dateRange, currentPage) {
    return new Promise((resolve, reject) => {

        const query = makeQueryAllEventsForUser(userId, dateRange, currentPage);

        excuteQuery(query)
            .then(res => res.json())
            .then(eventData => {
                resolve(processEventsResult(eventData));
            })
            .catch(reject);
    });
}
