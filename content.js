// s.setAttribute('data-version', browser.runtime.getManifest().version)
//TODO: Make this cleaner

let STR = {
    cur_meetings: "cur_meetings",
    users: "users",
    all_other_meetings: "other_meetings"
}
class Meeting {
    lastUpdated = + new Date();
    meeting_code = undefined;
    user_data = {};
    category = "UNCATEGORIZED";
}
let debug = false;
// let ready_for_output = true;
try{
    if (window.location.pathname !== "/") {

        $(window).arrive('[jscontroller="ES310d"]', () => {
            $(window).unbindArrive();
            //Actually in a valid meeting
            let el = document.createElement("data_transfer");
            document.body.appendChild(el);

            let cur_meetings_data, user_database, cur_meeting, meeting_database, meet_code;
    
            let promises = [getFromStorage(STR.cur_meetings), getFromStorage(STR.users), getFromStorage(STR.all_other_meetings)];
    
    
            Promise.allSettled(promises).then((vals) => {
                cur_meetings_data = vals[0].value || [];
                meet_code = $('[data-meeting-code]').attr('data-meeting-code');
                user_database = vals[1].value || {};
                meeting_database = vals[2].value || {};
    
                let addNewMeeting = true;
                for (let meet of cur_meetings_data) {
                    if (meet.meeting_code == meet_code && !isExpired(meet)) {
                        addNewMeeting = false;
                        break;
                    }
                }

                for (let i = 0; i < cur_meetings_data.length;) {
                    if (isExpired(cur_meetings_data[i])) {
                        //Removes meet from current meetings list and puts it into long-term storage
                        let removed_meet = cur_meetings_data.splice(i, i + 1)[0];
                        if (meeting_database[removed_meet.category]) {
                            meeting_database[removed_meet.category].push(removed_meet);
                        } else {
                            meeting_database[removed_meet.category] = [removed_meet];
                        }
                    } else {
    
                        i++;
                    }
                }
                setInStorage(STR.all_other_meetings, meeting_database);

                if (addNewMeeting) {
                    cur_meetings_data.push(new Meeting());
                }
    
                sendScript("/external/jquery.js").onload = () => {
                    sendScript("/external/arrive.js").onload = () => {
                        sendScript("script.js").onload = () => {
                            const event = new CustomEvent('data', {
                                detail: {
                                    meeting_data: cur_meetings_data,
                                    user_database: user_database,
                                    meeting_database: meeting_database
                                }
                            });
                            $("data_transfer")[0].dispatchEvent(event);
                        }
                    }
                }
                chrome.runtime.onMessage.addListener(
                    function (message, _, sendResponse) {
                        switch (message.type) {
                            case "get_meeting_data":
                                sendResponse({
                                    cur_meeting: cur_meeting,
                                    user_database: user_database,
                                    meeting_database: meeting_database
    
                                });
                                // console.log("sending",cur_meeting,user_database);
                                break;
                            default:
                                break;
                        }
                    }
                );
            });
    
            $("data_transfer")[0].addEventListener('terry_time', function (e) {
                cur_meeting = e.detail.meeting_data;
    
                let merged = false
                let defaultMeeting = -1;
                for (let [i, meet] of cur_meetings_data.entries()) {
                    if (meet.meeting_code == cur_meeting.meeting_code) {
                        cur_meetings_data[i] = cur_meeting;
                        merged = true;
                        break;
                    }else if(!meet.meeting_code){
                        defaultMeeting = i;
                    }
                }
    
                if (!merged) {
                    cur_meetings_data[defaultMeeting] = cur_meeting;
                    // cur_meetings_data.push(cur_meeting);
                }
    
                user_database = e.detail.user_database;
                // console.log(user_database);
                chrome.storage.local.set({
                    [STR.cur_meetings]: cur_meetings_data,
                    [STR.users]: user_database
                });
            });
        });
    
    } else {
        console.log("Not in meet");
    }
}catch(e){
    console.log("Error in content.js",e);
}


function getFromStorage(key) {
    return new Promise((re) => {
        chrome.storage.local.get(key, function (result) {
            re(result[key]);
        });
    });
}
function setInStorage(key, val) {
    return new Promise((re) => {
        chrome.storage.local.set({ [key]: val }, function () {
            re();
        });
    });
}
function sendScript(name, external = false) {
    var s = document.createElement('script');
    if (external) {
        s.src = name;
    } else {
        s.src = chrome.runtime.getURL(name);

    }
    document.body.appendChild(s);

    return s;
}
function isExpired(meet) {
    return debug||(new Date() - meet.lastUpdated) / (60000) >= 30;
}
async function debug1(){
    let users = await getFromStorage(STR.users);
    console.log(users["lh6-1iktIIrFuAUAAAAAAAAAAIAAAAAAAAAEYAMZuucmQDOe4JqRVbZ5J9p72-J_liiy-lws192-c-mophotojpg"]);
    console.log(delete users["lh6-1iktIIrFuAUAAAAAAAAAAIAAAAAAAAAEYAMZuucmQDOe4JqRVbZ5J9p72-J_liiy-lws192-c-mophotojpg"]);
    console.log(users["lh6-1iktIIrFuAUAAAAAAAAAAIAAAAAAAAAEYAMZuucmQDOe4JqRVbZ5J9p72-J_liiy-lws192-c-mophotojpg"]);
    await setInStorage(STR.users,users);
}
// chrome.storage.local.set({key: value}, function() {
//     console.log('Value is set to ' + value);
//   });
// window.get = (key) => {
//     return new Promise((re) => {
//         chrome.storage.sync.get(key, function (result) {
//             console.log('Value currently is ' + result[key]);
//             re(result[key]);
//         });
//     });
// }
// window.set = (key,val) =>{
//     return new Promise((re) => {
//         chrome.storage.sync.set({ [key]: val }, function () {
//             console.log('Value is set to ' + value);
//             re();
//         });
//     });
// }

// window.addEventListener('storage', function(e) {
//     console.log(e);
// });
