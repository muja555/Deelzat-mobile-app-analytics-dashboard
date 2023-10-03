import React, { useState } from 'react';
import {sendChatFromAlgoliaStyle as style} from "./send-chat-from-algolia.component.style";
import Hypnosis from "react-cssfx-loading/lib/Hypnosis";
import {getAlgoliaProductsWithLastUpdate, testDB} from "../../misc/apis";


function SendChatFromAlgolia() {

    const [isLoading, isLoadingSet] = useState(false);
    const [numberOfDays, numberOfDaysSet] = useState(40);

    const onClickSearch = () => {
        if (!numberOfDays || numberOfDays < 0) {
            alert('enter valid days');
            return;
        }

        isLoadingSet(true);

        getAlgoliaProductsWithLastUpdate()
            .then(res => res.json())
            .then(console.log)
            .catch(console.warn)
            .finally(() => isLoadingSet(false))

    }


    return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{height: 10}}/>
            <div style={{display: 'flex', flexDirection: 'row', marginBottom: 15}}>
                <div>
                    get shops where last updated
                </div>
                <input type="text"
                       style={{width: 50, marginRight: 10, marginLeft: 10}}
                       value={numberOfDays}
                       onChange={(event) => {
                           const value = event.target.value;
                           numberOfDaysSet(value);
                       }}
                />
                <div>
                    days ago
                </div>
            </div>
            {
                (!isLoading) &&
                <div style={style.sendButton} onClick={onClickSearch}>
                    Search
                </div>
            }
            {
                (isLoading) &&
                <Hypnosis color="#ffac44" width="40px" height="40px" duration="1s" />
            }



        </div>
    );
}

export default SendChatFromAlgolia;
