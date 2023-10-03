import * as React from 'react';
import {userTimelineStyle as style} from "./user-timeline.component.style";
import {
    useParams
} from "react-router-dom";
import {useEffect, useState} from "react";
import {useLocation} from "react-router-dom";
import {queryAllUserEvents} from "../../misc/query-excuter";
import {Grid} from "react-loader-spinner";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";
import AnimateHeight from 'react-animate-height';
import useWindowDimensions from "../../misc/windows-dimensions.hook";
import {JsonTable} from "react-json-to-html";
import {Masonry} from '@mui/lab';
import ArrowIcon from '../../assets/arrow.png';


const UserTimeline = (props) => {
    const {
        userId
    } = useParams();

    const {height, width} = useWindowDimensions();

    const [currentPage, currentPageSet] = useState(0);
    const [dateRange, dateRangeSet] = useState([]);
    const [filterWithinDateRange, filterWithinDateRangeSet] = useState(false);
    const [results, resultsSet] = useState([]);
    const [isRequesting, isRequestingSet] = useState(true);
    const [maxDate] = useState(new Date());
    const [minDate] = useState(new Date(2021, 11, 17));

    const [openedRows, openedRowsSet] = useState([]);

    const query = new URLSearchParams(useLocation().search);


    useEffect(() => {
        const startDate = query.get('startDate');
        const endDate = query.get('endDate');

        if (startDate && endDate) {
            dateRangeSet([
                new Date(parseInt(startDate)),
                new Date(parseInt(endDate))
            ]);
        }
    }, []);

    useEffect(() => {
        if (dateRange.length === 2) {
            isRequestingSet(true);
            openedRowsSet([]);
            resultsSet([]);

            queryAllUserEvents(userId, filterWithinDateRange ? dateRange : [], currentPage)
                .then(rows => {
                    resultsSet(rows);
                    isRequestingSet(false);
                });
        }
    }, [dateRange, filterWithinDateRange, currentPage]);


    const renderPageCotroller = (
        <div style={style.paginationView}>
            {
                (currentPage > 0) &&
                <img src={ArrowIcon} style={style.paginationBtn}
                     onClick={() => currentPageSet(prev => prev - 1)}/>
            }
            {currentPage + 1}
            {
                (results.length > 0) &&
                <img src={ArrowIcon} style={{...style.paginationBtn, transform: 'scaleX(-1)',}}
                     onClick={() => currentPageSet(prev => prev + 1)}/>
            }
        </div>
    )


    return (
        <div style={style.container}>
            <div style={{height: 40}}/>
            <div style={style.dateRangeTopSection}>
                <div style={{display: 'flex', flexDirection: 'row'}}>
                    <input
                        style={{marginTop: 5}}
                        name="Filter within\nthis date range"
                        type="checkbox"
                        checked={filterWithinDateRange}
                        onChange={(event) => {
                            const isChecked = event.target.checked;
                            filterWithinDateRangeSet(isChecked);
                        }}/>
                    <div style={{width: 150}}>
                        filter in date range
                    </div>
                </div>
                {
                    (filterWithinDateRange) &&
                    <div>
                        <DateRangePicker
                            onChange={(dateRange) => {
                                currentPageSet(0);
                                dateRangeSet(dateRange);
                            }}
                            value={dateRange}
                            maxDate={maxDate}
                            minDate={minDate}/>
                    </div>
                }
            </div>
            <div style={{height: 40}}/>
            {
                (isRequesting) &&
                <div style={style.loader}>
                    <Grid color="#00BFFF" height={40} width={40}/>
                </div>
            }
            {
                (!isRequesting) &&
                <>
                    {renderPageCotroller}
                    <table style={{width: width * 0.8}}>
                        <thead>
                        <tr>
                            <th style={{width: '40%'}}>
                                event date
                            </th>
                            <th>
                                event name
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            results.map((row, index) => {

                                const eventTimestamp = row['event_timestamp'] / 1000;
                                const eventDate = new Date(eventTimestamp).toLocaleDateString("en-US")
                                    + '\n'
                                    + new Date(eventTimestamp).toLocaleTimeString("en-US");


                                const isOpened = openedRows.includes(index);

                                const onCLickRow = () => {
                                    if (isOpened) {
                                        openedRowsSet(prev => prev.filter(r => r !== index));
                                    } else {
                                        console.log("user-timeline.component.js " + " result['event_params']", row)
                                        openedRowsSet([index]);
                                    }
                                }

                                return (
                                    <>
                                        <tr key={index + ''}
                                            onClick={onCLickRow}
                                            pointerEvents={'pointer'}
                                            style={{cursor: 'pointer', height: 50}}>
                                            <td style={{height: 50}}>
                                                {eventDate}
                                            </td>
                                            <td style={{height: 50}}>
                                                {row['event_name']}
                                            </td>
                                            <AnimateHeight
                                                duration={500}
                                                style={{position: 'absolute', left: '9.5%',}}
                                                height={isOpened ? 'auto' : 0}>
                                                <div style={{...style.detailsBlock1, width: width * 0.82}}>
                                                    <div style={style.detailsBlock2}>
                                                        <h3>
                                                            {`${row['event_name']}`}
                                                        </h3>
                                                        <h6>
                                                            {eventDate.replace('\n', '   ')}
                                                        </h6>
                                                    </div>
                                                    <Masonry columns={2} spacing={2}>
                                                        <div style={style.tableContainer}>
                                                            <div style={style.tableTitle}>
                                                                Event Params
                                                            </div>
                                                            <JsonTable json={row['event_params']}
                                                                       css={style.jsonTable}/>
                                                        </div>

                                                        {
                                                            (row['items']?.length > 0) &&
                                                            <div style={style.tableContainer}>
                                                                <div style={style.tableTitle}>
                                                                    Items
                                                                </div>
                                                                {
                                                                    row['items'].map((data, index) => (
                                                                        <div key={index}>
                                                                            <JsonTable json={data}
                                                                                       css={style.jsonTable}/>
                                                                        </div>

                                                                    ))
                                                                }
                                                            </div>
                                                        }
                                                        <div style={style.tableContainer}>
                                                            <div style={style.tableTitle}>
                                                                User Properties
                                                            </div>
                                                            <JsonTable json={row['user_properties']}
                                                                       css={style.jsonTable}/>
                                                        </div>
                                                        <div style={style.tableContainer}>
                                                            <div style={style.tableTitle}>
                                                                App Info
                                                            </div>
                                                            <JsonTable json={row['app_info']}
                                                                       css={style.jsonTable}/>
                                                        </div>
                                                        <div style={style.tableContainer}>
                                                            <div style={style.tableTitle}>
                                                                Device
                                                            </div>
                                                            <JsonTable json={row['device']}
                                                                       css={style.jsonTable}/>
                                                        </div>
                                                        <div style={style.tableContainer}>
                                                            <div style={style.tableTitle}>
                                                                Geo
                                                            </div>
                                                            <JsonTable json={row['geo']}
                                                                       css={style.jsonTable}/>
                                                        </div>
                                                    </Masonry>
                                                </div>
                                            </AnimateHeight>
                                        </tr>
                                    </>

                                )
                            })
                        }
                        </tbody>
                    </table>
                    <div style={{marginTop: 20, marginBottom: 50}}>
                        {renderPageCotroller}
                    </div>
                </>
            }
        </div>
    )
}
export {UserTimeline as UserTimeline}
