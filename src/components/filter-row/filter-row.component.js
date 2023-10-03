import {useEffect, useState} from "react";
import {FILTER_TYPES} from "../../constants/filter-types.const";
import {
    makeQueryOfAllEventNameParams,
} from "../../misc/query-maker";
import {excuteQuery} from "../../misc/apis";
import {filterRowStyle as style} from "./filter-row.component.style";
import Select from "react-select";
import {convertArrToSelectOptions, getFilterEventParamOptions} from "../../misc/misc";
import {FILTER_OPERATORS} from "../../constants/filter-operators.const";
import ReactTooltip from "react-tooltip";
import * as React from "react";
import {getPossibleValuesForFilter} from "../../misc/query-excuter";


const FilterTypes = [
    { value: FILTER_TYPES.USER_PROP, label: 'User Property' },
    { value: FILTER_TYPES.EVENT, label: 'Event' },
];

const FilterRow = (props) => {
    const {
        index,
        userProperties = [],
        eventNames = [],
        onEditFilter = (filter) => {}, // {type, key, op, vale}
        onPressDelete = (index) => {}
    } = props;

    const [filterType, filterTypeSet] = useState();
    const [filterKey, filterKeySet] = useState();
    const [filterSubKey, filterSubKeySet] = useState();
    const [filterComparator, filterComparatorSet] = useState();
    const [filterValue, filterValueSet] = useState();
    const [filterUserPropInDateRange, filterUserPropInDateRangeSet] = useState(false);

    const [allValues, allValuesSet] = useState([]);
    const [allEventParams, allEventParamsSet] = useState([]);

    const [isExpandEventQuery, isExpandEventQuerySet] = useState(false);

    useEffect(() => {
        if (!filterType || !filterKey || (filterType?.value === FILTER_TYPES.EVENT && !filterSubKey)) {
            return;
        }

        // Get sample of possible values
        getPossibleValuesForFilter({
            type: filterType?.value,
            key: filterKey?.value,
            subKey: filterSubKey?.value,
            op: filterComparator,
            value: filterValue
        })
            .then(allValuesSet)
            .catch(console.log);

    }, [filterType,  filterSubKey, filterKey]);


    useEffect(() => {

        // Get all event keys for an event name
        if (filterType?.value === FILTER_TYPES.EVENT && !!filterKey?.value) {
            const query = makeQueryOfAllEventNameParams(filterKey?.value);
            excuteQuery(query)
                .then(response => response.json())
                .then((rows = []) => {
                    allEventParamsSet(rows.map(r => r['eventParamKey']));
                })
                .catch(console.log);
        }
    }, [filterType, filterKey]);




    const selectOn = (userPropVal, eventVal) => {
        if (filterType?.value === FILTER_TYPES.USER_PROP) {
            return userPropVal;
        } else if (filterType?.value === FILTER_TYPES.EVENT) {
            return eventVal;
        }
    }


    const getSelectStyle = (width) => (
        {
            container: (provided, state) => ({
                ...provided,
                ...style.selectField,
                width: width
            })
        }
    );

    useEffect(() => {
        if (!isExpandEventQuery && filterType?.value === FILTER_TYPES.EVENT) {
            filterSubKeySet();
            filterComparatorSet();
            filterValueSet();
            onEditFilter({
                type: filterType?.value,
                key: filterKey?.value,
                subKey: '',
                op: '',
                value: '',
            });
        }
    }, [isExpandEventQuery]);

    const displayExtendedOperatorFeilds = filterType?.value === FILTER_TYPES.USER_PROP
        || (filterType?.value === FILTER_TYPES.EVENT && isExpandEventQuery);

    return (
        <div key={props.key + ''}
             style={style.container}>
            <div style={style.filterNum}>
                {index + 1}
            </div>
            <div style={style.deleteFilter}
                 pointerEvents={'none'}
                 onClick={onPressDelete}>
                -
            </div>
            <Select
                styles={getSelectStyle('13%')}
                placeholder="Filter Type"
                defaultValue={filterType}
                onChange={(option) => {
                    filterTypeSet(option);
                    filterKeySet();
                    filterSubKeySet();
                    onEditFilter({
                        type: option?.value,
                        op: filterComparator,
                        value: filterValue,
                    });
                }}
                options={FilterTypes}
            />
            <Select
                styles={getSelectStyle('22%')}
                placeholder={selectOn('User Property', 'Event name') || ' '}
                defaultValue={filterKey}
                value={{label: filterKey?.value, value: filterKey?.value}}
                onChange={(option) => {
                    filterKeySet(option);
                    onEditFilter({
                        type: filterType?.value,
                        key: option?.value,
                        subKey: filterSubKey?.value,
                        op: filterComparator,
                        value: filterValue,
                        filterUserPropInDateRange
                    });
                }}
                options={selectOn(
                    convertArrToSelectOptions(userProperties),
                    convertArrToSelectOptions(eventNames)
                )}
            />
            {
                (filterType?.value === FILTER_TYPES.EVENT) &&
                <>
                    {
                        (!isExpandEventQuery) &&
                        <div style={{...style.deleteFilter, ...style.deleteFilterSmall}}
                             pointerEvents={'none'}
                             onClick={() => isExpandEventQuerySet(true)}>
                            +
                        </div>
                    }
                    {
                        (displayExtendedOperatorFeilds) &&
                        <Select
                            styles={getSelectStyle('22%')}
                            placeholder={'Event param key'}
                            defaultValue={filterSubKey}
                            value={{label: filterSubKey?.value, value: filterSubKey?.value}}
                            onChange={(option) => {
                                filterSubKeySet(option);
                                onEditFilter({
                                    type: filterType?.value,
                                    key: filterKey?.value,
                                    subKey: option?.value,
                                    op: filterComparator,
                                    value: filterValue,
                                    filterUserPropInDateRange
                                });
                            }}
                            options={getFilterEventParamOptions(filterKey?.value, allEventParams)}
                        />
                    }
                </>
            }
            {
                (displayExtendedOperatorFeilds) &&
                <Select
                    styles={getSelectStyle('14%')}
                    placeholder="operator"
                    defaultValue={filterComparator}
                    onChange={(option) => {
                        filterComparatorSet(option?.value);
                        onEditFilter({
                            type: filterType?.value,
                            key: filterKey?.value,
                            subKey: filterSubKey?.value,
                            op: option?.value,
                            value: filterValue,
                            filterUserPropInDateRange
                        });
                    }}
                    options={FILTER_OPERATORS.map(op => ({value: op, label: op}))}
                />
            }
            {
                (displayExtendedOperatorFeilds) &&
                    <>
                        <ReactTooltip id="valuesForFilter" place="top" effect="solid">
                            <div>
                                {
                                    allValues.map((value, index) => <div key={index + ''}>{value}</div>)
                                }
                            </div>
                        </ReactTooltip>
                        <input type="text"
                               data-tip data-for="valuesForFilter"
                               style={style.inputField}
                               value={filterValue}
                               onChange={(event) => {
                                   const value = event.target.value;
                                   onEditFilter({
                                       type: filterType?.value,
                                       key: filterKey?.value,
                                       subKey: filterSubKey?.value,
                                       op: filterComparator,
                                       value: value,
                                       filterUserPropInDateRange
                                   });
                                   filterValueSet(value);
                               }} />
                    </>
            }
            {
                (isExpandEventQuery) &&
                <div style={{...style.deleteFilter, ...style.deleteFilterSmall}}
                     pointerEvents={'none'}
                     onClick={() => isExpandEventQuerySet(false)}>
                    -
                </div>
            }

            {
                (filterType?.value === FILTER_TYPES.USER_PROP) &&
                <div style={{marginTop: -7, marginLeft: 15, marginRight: 15}}>
                    <div style={{fontSize: 10}}>
                        {"last seen"}
                    </div>
                    <div style={{fontSize: 10}}>
                        {"within date range"}
                    </div>
                    <input
                        name="Filter within\nthis date range"
                        type="checkbox"
                        checked={filterUserPropInDateRange}
                        onChange={(event) => {
                            const isChecked = event.target.checked;
                            onEditFilter({
                                type: filterType?.value,
                                key: filterKey?.value,
                                subKey: filterSubKey?.value,
                                op: filterComparator,
                                value: filterValue,
                                filterUserPropInDateRange: isChecked
                            });
                            filterUserPropInDateRangeSet(isChecked);
                        }} />
                </div>
            }
        </div>
    )
}
export default FilterRow;
