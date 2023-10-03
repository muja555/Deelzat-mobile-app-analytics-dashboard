const style = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    loader: {
        minWidth: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20
    },
    dateRangeTopSection: {
        display: 'flex',
        flexDirection: 'column',
        width: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    detailsBlock1: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
    },
    detailsBlock2: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: 10,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    tableContainer: {
        display: 'flex', alignItems: 'center', flexDirection: 'column'
    },
    paginationView: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        fontSize: 20
    },
    paginationBtn: {
        width: 15,
        height: 30,
        marginLeft: 10,
        marginRight: 10,
        cursor: 'pointer',
    },
    tableTitle: {
        marginBottom: -10,
        fontSize: 12,
        fontWeight: 'bold',
    },
    jsonTable: {
        jsonTr: {
            borderRadius: 2,
            height: '22px',
        },
        jsonTd: {
            padding: '5px',
            borderSpacing: '1px',
            borderRadius: '1px',
        },
        rowSpacer: {
            height: '2px'
        },
        rootElement: {
            padding: '5px',
            borderSpacing: '2px',
            backgroundColor: '#155779',
            fontWeight: 'bold',
            fontFamily: 'Arial',
            borderRadius: '5px'
        },
        subElement: {
            padding: '5px',
            borderSpacing: '2px',
            backgroundColor: '#DDDDDD',
            fontWeight: 'bold',
            fontFamily: 'Arial',
            borderRadius: '5px',
            color: '#000'
        },
        dataCell: {
            borderSpacing: '2px',
            backgroundColor: '#727272',
            fontFamily: 'Arial',
            borderRadius: '5px',
        }
    }
}

export {style as userTimelineStyle};
