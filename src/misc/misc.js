import {ITEMS_PARAMS} from "../constants/items-event-params.const";
import {FILTER_TYPES} from "../constants/filter-types.const";
import {EVENT_DATA_TYPES as DataType} from "../constants/event-data-types.const";


export function renameKeys(obj, newKeys) {
    const keyValues = Object.keys(obj).map(key => {
        const newKey = newKeys[key] || key;
        return { [newKey]: obj[key] };
    });
    return Object.assign({}, ...keyValues);
}


export function removeEmptyKeys(obj) {
    Object.entries(obj).forEach(([k, v]) => {
        (v ?? delete obj[k]);

        if (obj[k] === '(not set)' || obj[k] === '') {
            delete obj[k];
        }

        if (v && typeof v === 'object') {
            removeEmptyKeys(v)
        }
    });
}


export function addToDate(startingDate, number) {
    return new Date(new Date().setDate(startingDate.getDate() + number));
}

export const isNumeric = (num) => /^-?[0-9]+(?:\.[0-9]+)?$/.test(num + '');

const isUpper = (str) => {
    return !/[a-z]/.test(str) && /[A-Z]/.test(str);
}
export {isUpper as isUpper}


export function isNumericEventParams(param) {
    if (param === 'images_count'
        || param === 'source_position'
    ) {
        return true;
    }

    return  false;
}

const isEventHasItemsParam = (eventName) => {
    return eventName === 'add_to_cart'
        || eventName === 'add_to_wishlist'
        || eventName === 'view_item'
        || eventName === 'view_cart'
        || eventName === 'begin_checkout'
        || eventName === 'purchase';
}
export {isEventHasItemsParam as isEventHasItemsParam}


const isEventParamOfItems = (paramKey) => {
    return !!ITEMS_PARAMS.find(item => item.name === paramKey)
}
export {isEventParamOfItems as isEventParamOfItems}


const isNumericFilterValue = (filter) => {

    if (filter.type === FILTER_TYPES.USER_PROP) {
        return filter.key === 'shop_products_count' || filter.key === 'cart_items';
    }


    if (isEventHasItemsParam(filter.key)
        && isEventParamOfItems(filter.subKey)) {

        return ITEMS_PARAMS.find(item => item.name === filter.subKey)?.type === DataType.NUMBER;
    } else {

        return filter.subKey === 'price'
            || filter.subKey === 'inventory'
            || filter.subKey === 'compare_at_price'
            || filter.subKey === 'source_position'
            || filter.subKey === 'following_list_count';
    }
}
export {isNumericFilterValue as isNumericFilterValue}


const getFilterValue = (filter = {}) => {

    if (isNumericFilterValue(filter)) {
        return filter.value;
    }

    return "'" + filter.value + "'";
}
export {getFilterValue as getFilterValue}


const convertArrToSelectOptions = (strArr) => {
    return strArr.map(str => ({value: str, label: str}))
}
export {convertArrToSelectOptions as convertArrToSelectOptions}


const getFilterEventParamOptions = (eventName, eventParams) => {

    if (isEventHasItemsParam(eventName)) {
        return [
            {
                label: 'item params',
                options: convertArrToSelectOptions(ITEMS_PARAMS.map(param => param.name))
            },
            {
                label: 'event params',
                options: convertArrToSelectOptions(eventParams)
            }
        ]
    }

    return convertArrToSelectOptions(eventParams);
}
export {getFilterEventParamOptions as getFilterEventParamOptions}


export const polishArrayValues = (array) => {
    return array.map((_item) => {
        const item = _item;
        if (_item.value) {
            item.value = _item.value["double_value"]
                ?? _item.value["float_value"]
                ?? _item.value["int_value"]
                ?? _item.value["string_value"];
        }

        return item;
    });
}


export const processEventsResult = (results) => {

    results.forEach(result => {

        if (result['items']) {
            result['items'] = polishArrayValues(result['items']);
            result['items'].forEach(item => {
                Object.entries(item).forEach(([k, v]) => {
                    if (!ITEMS_PARAMS.find(i => i.name === k)) {
                        delete item[k];
                    }
                });
            });
        }

        if (result['user_properties']) {
            let userProps = {};
            result['user_properties'] = polishArrayValues(result['user_properties']);
            result['user_properties'].forEach(param => {
                let value = param.value;
                if (param.key.startsWith('is_')) {
                    value = value === 1 || value === '1' ? 'true' : 'false';
                }
                userProps = {...userProps, [param.key]: value}
            });
            result['user_properties'] = userProps;
        }

        if (result['event_params']) {

            let eventParams = {};
            result['event_params'] = polishArrayValues(result['event_params']);
            result['event_params'].forEach(param => {
                let value = param.value;
                if (param.key.startsWith('is_')) {
                    value = value === 1 || value === '1' ? 'true' : 'false';
                }
                eventParams = {...eventParams, [param.key]: value}
            });
            Object.entries(eventParams).forEach(([k, v]) => {
                if (k === 'firebase_previous_id'
                    || k === 'firebase_screen_id'
                    || k === 'entrances'
                    || k === 'firebase_previous_class'
                    || k === 'firebase_screen_class'
                    || k === 'engagement_time_msec'
                    || k === 'ga_session_id'
                    || k === 'ga_session_number'
                    || k === 'engaged_session_event'
                    || k === 'firebase_event_origin'
                ) {
                    delete eventParams[k];
                }
            });
            result['event_params'] = eventParams;
        }

        removeEmptyKeys(result);
    });

    return results.filter(result => {
        if (result['event_name'] === 'screen_view'
            && result['event_params']
            && result['event_params']['firebase_screen'] === result['event_params']['firebase_previous_screen']
        ) {
            return false;
        }

        return true;
    })

}


export function isEmptyString(str) {
    return str === '' || str === undefined || str === null
}



