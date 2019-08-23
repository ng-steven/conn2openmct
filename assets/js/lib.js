let records = [];
let order = 1;
(function() {
    let fifteenMinAgo = new Date();
    fifteenMinAgo.setMinutes(fifteenMinAgo.getMinutes() - 15);
    $("#start").text(fifteenMinAgo.toISOString());
    fifteenMinAgo = fifteenMinAgo.getTime();

    let currenttime = new Date();
    $("#end").text(currenttime.toISOString());
    currenttime = currenttime.getTime();

    $.getJSON( "http://localhost:8080/history/pwr.v?start="+fifteenMinAgo+"&end="+currenttime, function( data ) {
    })
        .done(function( data ) {
            records = data;
            setTable(data);
        });
})();
function sortByDate() {
    let step1 = ()=> {
        return new Promise(
            (resolve) => {
                if ( order !== 1) {
                    order = 1;
                    records.sort((a, b) => (a.timestamp == b.timestamp) ? 0 : (a.timestamp > b.timestamp) ? 1 : -1);
                    resolve();
                }
                else if ( order !== -1) {
                    order = -1;
                    records.sort((a, b) => (a.timestamp == b.timestamp) ? 0 : (a.timestamp > b.timestamp) ? -1 : 1);
                    resolve();
                }

            }
        );
    };
    let step2 = ()=> {
        return new Promise(
            (resolve) => {
                $("table tbody").empty();
                resolve();

            }
        );
    };
    let step3 = ()=> {
        return new Promise(
            (resolve) => {
                setTable(records);
                resolve();
            }
        );
    };
    step1()
        .then(step2)
        .then(step3);
}

function setTable(val) {
    try {
        $.each( val, function( i, item ) {
            buildTable(item);
        });
    }
    catch (e) {
        console.log(e)
    }
}

function buildTable(val) {
    let id = val.id;
    let timestamp = new Date(val.timestamp).toJSON();
    let value = val.value;
    let markup = "<tr><td><input type='checkbox' name='record'></td><td>" + id + "</td><td>" + timestamp + "</td><td>" + value + "</td></tr>";
    $("table tbody").append(markup);
}

function deleteselectedrecords() {
    $("table tbody").find('input[name="record"]').each(function(){
        if($(this).is(":checked")){
            $(this).parents("tr").remove();
        }
    });
}

function connectToRealTime(method) {
    try {
        let socket = new WebSocket("ws://localhost:8080/realtime");

        socket.onopen = function(e) {
            alert(`Connection to Server established. Request type: ${method}`);
            socket.send(method.toString()+' pwr.v');

            if (method === 'subscribe') {
                $("table tbody").empty();
                records = [];
            }
            else {
                socket.disconnect() // socket.close()
            }
        };

        socket.onmessage = function(event) {
            if (method === 'subscribe') {
                records.push(JSON.parse(event.data));
                $("#start").text(new Date(records[0].timestamp).toJSON());
                $("#end").text(new Date(records[records.length - 1].timestamp).toJSON());


                buildTable(JSON.parse(event.data));
            }


        };

        socket.onclose = function(event) {
            if (event.wasClean) {
                alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                alert('[close] Connection died');
            }
        };

        socket.onerror = function(error) {
            alert(`[error] ${error.message}`);
        };

    }
    catch (e) {
        console.log(e);
    }
}