const style = {
    container: {
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        width: '100%',
    },
    deleteFilter: {
        flex: 'display',
        marginRight: 10,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
        width: 30,
        height: 30,
        color: '#c7c6c6',
        backgroundColor: '#b1310a',
        border: '2px solid #d0d0d0',
        borderRadius: 50,
        fontSize: 16,
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    deleteFilterSmall: {
        marginRight: 10,
        marginLeft: 10,
        marginTop: 10,
        width: 20,
        height: 20,
        fontSize: 10,
        fontWeight: 900,
        color: '#c7c6c6',
        backgroundColor: '#b1310a',
        border: '2px solid #d0d0d0'
    },
    selectField: {
        marginRight: 10
    },
    inputField: {
        height: 37,
        borderRadius: 4,
        border: '1px solid #C7C6C6FF',
        paddingLeft: 5,
        paddingRight: 5,
    },
    valueFieldContainer: {
        width: '20%',
        marginRight: 20,
    },
    filterNum: {
        fontSize: 12,
        paddingTop: 8,
        marginRight: 12,
        fontWeight: 'bold',
        color: '#777'
    }
}
export { style as filterRowStyle };
