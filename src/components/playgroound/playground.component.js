import * as React from 'react';
import {useEffect, useState} from 'react';
import {playgroundStyle as style} from "./playground.component.style";
import DateRangePicker from '@wojtekmaj/react-daterange-picker'
import {Grid} from "react-loader-spinner";
import FilterRow from "../filter-row/filter-row.component";
import {
    getAllEventNames,
    getAllUserProps, queryChartedResultsOfEvent,
    queryFilterUserProfiles,
    querySegmentedResultsOfEvent
} from "../../misc/query-excuter";
import {addToDate, getFilterEventParamOptions, renameKeys} from "../../misc/misc";
import {FILTER_TYPES} from "../../constants/filter-types.const";
import {SendNotification} from "../send-notification/send-notification.component";
import Select from "react-select";
import {makeQueryOfAllEventNameParams} from "../../misc/query-maker";
import {excuteQuery} from "../../misc/apis";
import ReactApexChart from "react-apexcharts";
import CanvasJSReact from '../../assets/canvasjs.react';
var CanvasJSChart = CanvasJSReact.CanvasJSChart;


function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
        width,
        height
    };
}

const QUERY_MODES = {};
QUERY_MODES.USER_PROFILES = 'USER_PROFILES';
QUERY_MODES.EVENT_PIECHART = 'EVENT_PIECHART';
QUERY_MODES.EVENT_TIMECHART = 'EVENT_TIMECHART';


const TOP_LIMIT_SEGMENT = 30;

export function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}


const Playground = (props) => {

    const [queries, queriesSet] = useState([]);
    const [dateRange, onChange] = useState([
        addToDate(new Date(), -2),
        addToDate(new Date(), -1)
    ]);
    const [maxDate] = useState(new Date());
    const [minDate] = useState(new Date(2021, 11, 17));

    const [queryMode, queryModeSet] = useState();
    const [isRequesting, isRequestingSet] = useState(false);
    const [userProperties, userPropertiesSet] = useState([]);
    const [eventNames, eventNamesSet] = useState([]);
    const [results, resultsSet] = useState([]);

    const [enableSegmentedQuery, enableSegmentedQuerySet] = useState();

    const [segmentTitleBy, segmentTitleBySet] = useState();
    const [segmentFilterBy, segmentFilterBySet] = useState();
    const [allEventParams, allEventParamsSet] = useState([]);
    const [pieChartOptions, pieChartOptionsSet] = useState();


    const { height, width } = useWindowDimensions();

    const [showLikeHint, showLikeHintSet] = useState(false);

    useEffect(() => {

        let showHint = false;
        queries.forEach(query => {
            if (query.op === 'LIKE') {
                showHint = true;
            }
        });

        showLikeHintSet(showHint);
    }, [queries]);


    useEffect(() => {

        // Get User Properties out there
        getAllUserProps()
            .then(userPropertiesSet)
            .catch(console.log);

        // Get all events
        getAllEventNames()
            .then(eventNamesSet)
            .catch(console.log);

    }, []);


    // Enable segmentation on editing filters
    useEffect(() => {

        const firstEventName = queries.length > 0 ? queries[0].key: '!!';

        let isValid = true;
        if (queries.length > 0) {
            queries.forEach((query) => {
                if (query.type !== FILTER_TYPES.EVENT) {
                    isValid = false;
                }

                if (!query.key) {
                    isValid = false;
                }

                if (query.key !== firstEventName) {
                    isValid = false;
                }
            })
        }
        else {
            isValid = false;
        }

        enableSegmentedQuerySet(isValid);
    }, [queries]);


    useEffect(() => {

        // Get all event keys for an segment filter
        if (queries.length === 1 && queries[0].type === FILTER_TYPES.EVENT) {
            const query = makeQueryOfAllEventNameParams(queries[0]?.key);
            excuteQuery(query)
                .then(response => response.json())
                .then((rows = []) => {
                    allEventParamsSet(rows.map(r => r['eventParamKey']));
                })
                .catch(console.log);
        }
    }, [queries])



    const validate = (validateWithSegments) => {

        if (!queries.length) {
            return '========= queries are empty =========';
        }

        let errorMessage;
        if (validateWithSegments && !segmentFilterBy) {
            return 'segment by: is missing '
        }
        queries.forEach((query, index) => {
            if (!query.type) {
                errorMessage = `filter type is missing in filter ${index + 1}`;
            } else if (!query.key) {
                errorMessage =  `filter key is missing in filter ${index + 1}`;
            } else if (query.type === FILTER_TYPES.USER_PROP && !query.op) {
                errorMessage = `user property filter is missing operator ${index + 1}`;
            }
        });

        return errorMessage;
    }


    const onPressQuery = () => {

        let errorMessage = validate();
        if (errorMessage) {
            alert(`========= \n${errorMessage}\n =========`);
        }
        else {

            queryModeSet(QUERY_MODES.USER_PROFILES);

            pieChartOptionsSet();
            resultsSet([]);
            segmentTitleBySet();
            isRequestingSet(true);
            segmentFilterBySet();
            queryFilterUserProfiles(queries, userProperties, dateRange)
                .then((rows = []) => {
                    resultsSet(rows);
                    isRequestingSet(false);
                })
                .catch(console.warn);
        }
    }


    const onPressSegmentedQuery = () => {
        let errorMessage = validate(true);
        if (errorMessage) {
            alert(`========= \n${errorMessage}\n =========`);
        }
        else {
            queryModeSet(QUERY_MODES.EVENT_PIECHART);

            isRequestingSet(true);
            pieChartOptionsSet();
            resultsSet([]);
            segmentTitleBySet();
            querySegmentedResultsOfEvent(queries, segmentFilterBy?.value, dateRange, TOP_LIMIT_SEGMENT)
                .then((rows = []) => {

                    const options = {
                        series: rows.map((row) => parseInt(row.cccount)),
                        labels: rows.map((row) => {
                            let label = row.valuee;
                            if (typeof row.valuee === 'string' && row.valuee?.includes('@@@')) {
                                label = row.valuee.split('@@@')[0]
                            }
                            return label;
                        }),
                        theme: {
                            monochrome: {
                                enabled: false
                            }
                        },
                        responsive: [
                            {
                                breakpoint: 480,
                                options: {
                                    chart: {
                                        width: '100%'
                                    },
                                    legend: {
                                        show: false
                                    }
                                }
                            }],
                        chart: {
                            events: {
                                dataPointSelection: (event, chartContext, config) => {
                                    console.log(config.w.config.labels[config.dataPointIndex]);
                                }
                            }
                        }
                    }
                    segmentTitleBySet(queries[0].key);
                    pieChartOptionsSet(options);
                    resultsSet(rows.map(row => {
                        let renamedObj =  renameKeys(row, {'valuee': segmentFilterBy?.value})
                        renamedObj =  renameKeys(renamedObj, {'cccount': 'count'})
                        return renamedObj;
                    }));
                    isRequestingSet(false);
                })
                .catch(console.warn);
        }
    }


    const onPressChartedTimelineQuery = () => {
        let errorMessage = validate();
        if (errorMessage) {
            alert(`========= \n${errorMessage}\n =========`);
        }
        else {

            queryModeSet(QUERY_MODES.EVENT_TIMECHART);

            isRequestingSet(true);
            pieChartOptionsSet();
            resultsSet([]);
            segmentTitleBySet();
            queryChartedResultsOfEvent(queries, dateRange)
                .then((rows = []) => {

                    const dataPoints = rows.map((row) => {
                        return { y: row.cccount, x: new Date(row.valuee?.value) };
                    });

                    const options = {
                        theme: "light2",
                        title: {
                            text: `event ${queries[0].key} occurrences`
                        },
                        width: width * 0.9,
                        axisY: {
                            title: "count",
                            prefix: ""
                        },
                        data: [{
                            type: "line",
                            xValueFormatString: "DD MMM YYYY",
                            dataPoints
                        }]
                    }
                    segmentTitleBySet(queries[0].key);
                    pieChartOptionsSet(options);
                    isRequestingSet(false);
                })
                .catch(console.warn);
        }
    }


    const onClickRow = (userId) => {
        window.open(`/user/${userId}?startDate=${dateRange[0].getTime()}&endDate=${dateRange[1].getTime()}`, '_blank')
    }

    const onClickSegmentRow = (row) => {
        if (row[segmentFilterBy?.value]?.includes('@@@')) {
            const productId = row[segmentFilterBy?.value].split('@@@')[1];
            window.open(`https://main.d2mwcd6hz2pdga.amplifyapp.com/?id=${productId}`, '_blank')
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


    return (
        <div>
            <div style={style.datePicker}>
                <DateRangePicker
                    onChange={onChange}
                    value={dateRange}
                    maxDate={maxDate}
                    minDate={minDate}
                />
            </div>
            {
                (showLikeHint) &&
                    <div>
                        <div style={{height: 50}}/>
                        <div>
                            LIKE operator example:
                        </div>
                        <div>
                            %PPL%  will match apple, qpplee, 111pl332 ...
                        </div>
                        <div>
                            059% will match 05986776, 059111111, ... and so
                        </div>
                        <div style={{height: 5}}/>
                    </div>
            }
            {
                (!showLikeHint) &&
                <div style={{height: 50}}/>
            }
            <div style={style.filtersView}>
                {
                    queries.map((_, index) => {

                        const onPressDelete = () => {
                            queriesSet(prev => {
                                const arr = [...prev];
                                arr.splice(index, 1);
                                return arr;
                            })
                        }

                        const onEditFilter = (query) => {
                            queriesSet(prev => {
                                prev[index] = query;
                                return [...prev];
                            })
                        }

                        return (
                            <div key={index + ''}>
                                <FilterRow onPressDelete={onPressDelete}
                                           onEditFilter={onEditFilter}
                                           index={index}
                                           eventNames={eventNames}
                                           userProperties={userProperties}/>
                                <div style={{height: 20}}/>
                            </div>
                        )
                    })
                }
                <div style={style.addFilter}
                     onClick={() => queriesSet(pre => [...pre, {}])}
                     pointerEvents={'none'}>
                    + Add Filter
                </div>
                <div style={{
                    height: 50
                }}/>
                <div style={{...style.addFilter, width: 120, backgroundColor: '#007aff'}}
                     onClick={onPressQuery}
                     pointerEvents={'none'}>
                    Query Users List
                </div>
                <div style={{
                    height: 20
                }}/>
                <div style={{...style.addFilter, width: 120, opacity: enableSegmentedQuery? 1: 0.5, backgroundColor: '#007aff'}}
                     onClick={enableSegmentedQuery? onPressChartedTimelineQuery: undefined}
                     pointerEvents={'none'}>
                    Query Timeline
                </div>
                <div style={{
                    height: 20
                }}/>
                <div style={style.segmentButtons}>
                    <div style={{...style.addFilter, width: 120, opacity: enableSegmentedQuery? 1: 0.5, backgroundColor: '#007aff'}}
                         onClick={enableSegmentedQuery? onPressSegmentedQuery: undefined}
                         pointerEvents={'none'}>
                        Query PieChart By:
                    </div>
                    <div style={{width: 40}}/>
                    {
                        (enableSegmentedQuery) &&
                            <>
                                <div>
                                    segment by:
                                </div>
                                <div style={{width: 10}}/>
                                <Select
                                    styles={getSelectStyle('22%')}
                                    placeholder={'Segment by:'}
                                    defaultValue={segmentFilterBy}
                                    value={{label: segmentFilterBy?.value, value: segmentFilterBy?.value}}
                                    onChange={(option) => {
                                        segmentFilterBySet(option);
                                    }}
                                    options={getFilterEventParamOptions(queries[0]?.key, allEventParams)}
                                />
                            </>
                    }
                </div>
            </div>
            {
                (isRequesting) &&
                <div style={{minWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 20}}>
                    <Grid color="#00BFFF" height={40} width={40}/>
                </div>
            }
            {
                (!isRequesting) &&
                <div style={{height: 60}}/>
            }
            {
                (queryMode === QUERY_MODES.EVENT_PIECHART && pieChartOptions && !isRequesting) &&
                <>
                    <ReactApexChart options={pieChartOptions}
                                    series={pieChartOptions.series}
                                    type="pie"
                                    width={width * 0.6}
                                    height={width * 0.4}/>
                    <div style={{height: 10}}/>
                </>
            }
            {
                (queryMode === QUERY_MODES.EVENT_TIMECHART && pieChartOptions && !isRequesting) &&
                <>
                    <CanvasJSChart options={pieChartOptions}/>
                    <div style={{height: 10}}/>
                </>
            }
            {
                (!pieChartOptions && !isRequesting) &&
                <SendNotification results={results}/>
            }
            {
                (!isRequesting && results?.length > 0) &&
                <div>
                    <div style={style.resultsCount}>
                        {pieChartOptions?
                            `top ${TOP_LIMIT_SEGMENT} ${segmentTitleBy} by ${segmentFilterBy?.value}`
                        :
                            `users count: ${results.length}`
                        }
                    </div>
                    <table>
                        <thead>
                        <tr>
                            {Object.keys(results[0]).map((key, index) => {
                                return (
                                    <th key={index}>{key}</th>
                                )
                            })}
                        </tr>
                        </thead>
                        <tbody>
                        {
                            results.map((row, index) => {
                                const rowVals = Object.keys(row).map(key => row[key]);
                                return (
                                    <tr key={index + ''}
                                        onClick={pieChartOptions? () => onClickSegmentRow(row): () => onClickRow(rowVals[0])}
                                        style={{  cursor: 'pointer',}}>
                                            {
                                                rowVals.map((val, index) =>  {

                                                    let display = val;
                                                    if (index === 1 && !segmentTitleBy) {   // format time stamp in normal results
                                                        display = new Date(val / 1000).toLocaleDateString("en-US") + '\n' + new Date(val / 1000).toLocaleTimeString("en-US");
                                                    } else if (isNaN(val) && val?.includes('@@@')) {
                                                        display = val.split('@@@')[0];
                                                    }

                                                    return (
                                                        <td key={index}>{display}</td>
                                                    )
                                                })
                                            }
                                    </tr>
                                )
                            })
                        }
                        </tbody>
                    </table>
                </div>
            }
        </div>
    )
};

export default Playground;
