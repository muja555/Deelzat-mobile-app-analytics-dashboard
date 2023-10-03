import * as React from 'react';
import {sendNotificationStyle as style} from "./send-notification.component.style";
import {useRef, useState} from "react";
import Accordion from "../Accordion";
import {ReactComponent as CloseIcon} from "../../assets/Close.svg";
import Hypnosis from "react-cssfx-loading/lib/Hypnosis";
import firebase from "../../firebase";
import {sendNotification} from "../../misc/apis";
import {SUPPORT_ACCOUNT} from "../../misc/support-account";
import SendChatFromAlgolia from "../send-chat-from-algolia/send-chat-from-algolia.component";

const SendNotification = (props) => {
    const {
        results = [],
    } = props;

    const [isStaging, isStagingSet] = useState(false);
    const [notificationText, notificationTextSet] = useState('');
    const [notificationTitle, notificationTitleSet] = useState('');
    const [imageToSend, imageToSendSet] = useState();
    const [isSending, isSendingSet] = useState(false);
    const [imageUploadPercentage, imageUploadPercentageSet] = useState(false);
    const imageRef = useRef(null);

    const [selectedIndex, selectedIndexSet] = useState(-1);


    const onPressSendBulkNotification = () => {

        if (!results.length) {
            alert('no users selected')
            return;
        }

        const userIds = results.map(item => item.user_id);

        if (!notificationTitle && !notificationText) {
            alert('=========\n Missing title or message! \n=========');
            return;
        }

        isSendingSet(true);
        sendNotification(notificationTitle, notificationText, imageToSend?.downloadURL, userIds, isStaging)
            .then((res) => {
                console.log(res);
                alert('notification sent!');
                isSendingSet(false);
            })
            .catch((e) => {
                console.warn(e);
                alert('notification error:\n ' + JSON.stringify(e));
                isSendingSet(false);
            })
    }


    const removeImageToSend = () => {
        imageToSend?.uploadTask?.cancel();

        firebase.storage()
            .ref(imageToSend.filePath)
            .delete()
            .then(() => {
                console.log('delete complete');
            })
            .catch(console.warn);

        imageToSendSet();
        imageUploadPercentageSet(0);
    }



    const startUploading = (file) => {

        const fileName = `${SUPPORT_ACCOUNT.userId}_${Math.random().toString(36).substring(7)}.jpg`;
        const folderName = new Date().toLocaleDateString('en-US').replace(/\//g, '-').replace(',', '-');
        const filePath = `analytics_dashboard/${folderName}/${fileName}`;

        const uploadTask = firebase.storage()
            .ref(filePath)
            .put(file);

        imageToSendSet(old => ({
            ...old,
            filePath,
            uploadTask
        }))

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const prog = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                imageUploadPercentageSet(prog);
            },
            (error) => console.log(error),
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then((url) => {
                    imageToSendSet(old => ({
                        ...old,
                        downloadURL: url
                    }));
                });
            }
        );
    }


    const onFileChange = (e) => {
        const files = e.target.files;
        if (files?.length > 0) {
            let file = files[0];
            file.src = URL.createObjectURL(file);
            imageToSendSet(file);

            startUploading(file);

            setTimeout(() => {
                imageRef?.current?.scrollIntoView({behavior: "smooth"});
            }, 100);
        }
    }


    const onChangeStagingOption = (event) => {
        const isChecked = event.target.checked;
        isStagingSet(isChecked);
    }


    return (
        <div style={style.accordionContainer1}>
            <div style={style.accordionContainer2}>
                <Accordion
                    className="accordion"
                    selectedIndex={selectedIndex}
                    onChange={(index, expanded, _selectedIndex) => selectedIndexSet(expanded ? _selectedIndex : -1)}>
                    <div
                        data-header="Send Bulk Notifiacitons"
                        className="accordion-item">
                        <input type="text"
                               style={style.inputFieldSmall}
                               value={notificationTitle}
                               placeholder={'notification title'}
                               onChange={(event) => {
                                   const value = event.target.value;
                                   notificationTitleSet(value);
                               }}/>
                        <input type="text"
                               style={style.inputField}
                               placeholder={'notification message'}
                               value={notificationText}
                               onChange={(event) => {
                                   const value = event.target.value;
                                   notificationTextSet(value);
                               }}/>
                        <div style={{marginTop: 10}}/>
                        {
                            (!imageToSend) &&
                            <input type="file" accept="image/*" onChange={onFileChange}/>
                        }
                        {
                            (!!imageToSend) &&
                            <div style={{display: 'flex'}}>
                                <img src={imageToSend.src} ref={imageRef} style={{
                                    width: 100,
                                    height: 100
                                }}/>
                                <a onClick={removeImageToSend}>
                                    <div  style={{marginLeft: -25, backgroundColor: 'white', borderRadius: 10, height: 25, cursor: 'pointer'}}>
                                        <CloseIcon style={{width: 17, height: 17, paddingRight: -10, marginTop: -3}}/>
                                    </div>
                                </a>
                                {
                                    (imageUploadPercentage < 100) &&
                                    <div style={{color: '#ff00aa', fontSize: 25, marginLeft: -70, marginTop: 44, fontWeight: 'bold'}}>
                                        {imageUploadPercentage >= 100 ? '✓' : '%' + imageUploadPercentage}
                                    </div>
                                }
                            </div>
                        }
                        <div style={{height: 25}}/>
                        {
                            (!isSending) &&
                                <div>
                                    <div style={style.sendButton}
                                         onClick={onPressSendBulkNotification}
                                         pointerEvents={'pointer'}>
                                        Send
                                    </div>

                                    <div style={{display: 'flex', flexDirection: 'row'}}>
                                        <div style={{fontSize: 10, marginLeft: 10, magin: 10}}>
                                            {"use staging api"}
                                        </div>
                                        <div style={{width: 10 }}/>

                                        <input
                                            name="use staging api"
                                            type="checkbox"
                                            checked={isStaging}
                                            onChange={onChangeStagingOption} />
                                    </div>

                                </div>
                        }
                        {
                            (isSending) &&
                            <Hypnosis color="#ffac44" width="40px" height="40px" duration="1s" />
                        }
                    </div>

                    {/*<div*/}
                    {/*    data-header="Send bulk In-App Chat For Outdated products"*/}
                    {/*    className="accordion-item">*/}
                    {/*    <SendChatFromAlgolia />*/}
                    {/*</div>*/}
                </Accordion>
            </div>
        </div>
    )
}
export {SendNotification as SendNotification}
