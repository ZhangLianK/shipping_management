// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt
let portOpen = false;
let portPromise;
let holdPort = null;
let port;
let reader;
let openCloseBtn;
let receivedData = "";



frappe.ui.form.on('Serial Port Reader', {
    // refresh: function(frm) {

    // }
    onload_post_render: function (frm) {
        //change the button color
        frm.get_field("gross_weight_btn").$input.css("background","#2590EF")
        frm.get_field("gross_weight_btn").$input.css("color","white")
        frm.get_field("btn_blank_weight").$input.css("background","#4CA86C")
        frm.get_field("btn_blank_weight").$input.css("color","white")
        frm.get_field("save_weight").$input.css("background","red")
        frm.get_field("save_weight").$input.css("color","white")
    },


    refresh: function (frm) {
        

        frm.set_query("scale_item", function () {
            return {
                filters: {
                    "status": ['not in', ['6 已完成', '9 已取消']],
                    "docstatus": 1,
                    "vehicle": frm.doc.vehicle,
                    "type": frm.doc.ship_type,
                }
            };
        });
        frm.set_query("warehouse", function () {
            return {
                filters: {
                    is_group: 1
                }
            };
        });
        frm.set_query("pot", function () {
            return {
                filters: {
                    is_group: 0,
                    "parent_warehouse": frm.doc.plant
                }
            };
        });

        clearTerminal(frm);
        // Assuming 'Open/Close Port' is a toggle action.
        openCloseBtn = frm.add_custom_button('Open Port', function () {
            if ("serial" in navigator) {
                openClose(frm);
            }
        });

        frm.add_custom_button('Clear Terminal', function () {
            // Logic to clear the terminal window
            clearTerminal(frm);
        });


        frm.add_custom_button('Print Label', function () {
            // Action when button is clicked
            var doc = frm.doc;
            if (!doc.scale_item || !doc.ship_type) {
                frappe.msgprint("请先选择物流计量单");
                return;
            }

            // Prepare your HTML content with real data
            var html_content = `
            <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/html" lang="zh" >
    <head>
        <title>称重计量单</title>
        <style>
            body {
                margin-top: 1rem;
                width: 210mm;
                height: 70mm;
                padding-top: 5%;
                padding-left: 10%;
                padding-right: 10%;
            }
            table {
                width: 100%;
            }
            table, th, td {
                border: 0.1rem solid black;
                border-collapse: collapse;
            }
            th {
                width: 20%;
                padding-left: 1%;
                text-align: left;
            }
            td {
                width: 30%;
                padding-left: 1%;
                text-align: left;
            }
            .header {
                display: flex;
                justify-content: space-between;
            }
            .title {
                text-align: center;
            }
            .signature {
                display: flex;
                justify-content: space-between;
                margin-top: 0.5rem;
            }
            .hd_txt {
                text-align: left;
            }
            .shd_txt {
                text-align: right;
            }
            .hd {
                float: left;
            }
            .shd {
                float: right;
            }

            @media print {
                @page {
                    size: 210mm 70mm;
                }
                body {
                    margin-top: 1rem;
                    padding-top: 5%;
                    padding-left: 10%;
                    padding-right: 10%;
                    page-break-inside: avoid;
                }
                nav {
                    display: none;
                }
                table {
                    width: 100%;
                }
                table, th, td {
                    border: 0.1rem solid black;
                    border-collapse: collapse;
                }
                th {
                    width: 20%;
                    padding-left: 1%;
                    text-align: left;
                }
                td {
                    width: 30%;
                    padding-left: 1%;
                    text-align: left;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                }
                .title {
                    text-align: center;
                }
                .signature {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 0.5rem;
                }
                .hd_txt {
                    text-align: left;
                }
                .shd_txt {
                    text-align: right;
                }
                .hd {
                    float: left;
                }
                .shd {
                    float: right;
                }
            }
        </style>
    </head>
    <body>
    <div id = "printableArea">
    <div class="header">
        <div class = "hd">
            <h3 class="hd_txt">称重计量单</h3>
            <p class="hd_txt">${doc.plant}</p>

        </div>
        <div class = "shd">
            <p class = "shd_txt">单号: ${doc.scale_item}</p>
            <p class="shd_txt">${doc.pot}</p>
        </div>
    </div>
    <table>
      <tr>
        <th>车号</th>
        <td>${doc.vehicle}</td>
        <th>毛重</th>
        <td>${doc.gross_weight}</td>
      </tr>
      <tr>
        <th>货名</th>
        <td>${doc.item_code}</td>
              <th>毛重时间</th>
        <td>${doc.gross_dt}</td>

      </tr>
      <tr>
        <th>发货单位</th>
        <td>______</td>

        <th>皮重</th>
        <td>${doc.blank_weight}</td>
      </tr>
      <tr>
        <th>收货单位</th>
        <td>______</td>
              <th>皮重时间</th>
        <td>${doc.blank_dt}</td>
      </tr>
      <tr>
        <th>打印时间</th>
        <td>${get_date_time()}</td>
            <th>净重</th>
        <td>${doc.net_weight}</td>
      </tr>
    </table>

    <div class="signature">
        <p class="hd">过磅员: ${frappe.session.user}</p>
        <p class="shd">司机: _________________</p>
    </div>
    </div>
    </body>
    </html>`;

            // Replace placeholders with actual data from the form
            //html_content = html_content.replace('{}', doc.name); // repeat for other fields

            // Call the print function
            print_html_label(html_content);
        });

    },
    onload: function (frm) {
        // Replace 'your_html_fieldname' with the actual fieldname of your HTML field.
        frm.fields_dict.screen.df.options = `
            <div style="background-color: black; color: white; height:100px; text-align: center;font-size:60px">
                <p>23000</p>
            </div>`;
    },
    gross_weight_btn: function (frm) {
        // Get the current data displayed in the 'screen' field's HTML
        const screenHTML = frm.fields_dict['screen'].wrapper.innerHTML;

        // Extract the content within the <p> tag
        const parser = new DOMParser();
        const htmlDocument = parser.parseFromString(screenHTML, 'text/html');
        const pContent = htmlDocument.querySelector('p').textContent;
        const regex = /(\d+\.\d+|\d+)/; // Adjust based on your exact data format
        const match = regex.exec(pContent);

        if (match !== null) {
            // If a match is found, update the 'data' field
            frm.set_value('gross_weight', match[0] / 1000);
            frm.refresh_field('gross_weight');

            // Update the 'timestamp' field with the current time
            frm.set_value('gross_dt', frappe.datetime.now_datetime());
            frm.refresh_field('gross_dt');
        }
    },
    btn_blank_weight: function (frm) {
        // Get the current data displayed in the 'screen' field's HTML
        const screenHTML = frm.fields_dict['screen'].wrapper.innerHTML;

        // Extract the content within the <p> tag
        const parser = new DOMParser();
        const htmlDocument = parser.parseFromString(screenHTML, 'text/html');
        const pContent = htmlDocument.querySelector('p').textContent;
        const regex = /(\d+\.\d+|\d+)/; // Adjust based on your exact data format
        const match = regex.exec(pContent);

        if (match !== null) {
            // If a match is found, update the 'data' field
            frm.set_value('blank_weight', match[0] / 1000);
            frm.refresh_field('blank_weight');

            // Update the 'timestamp' field with the current time
            frm.set_value('blank_dt', frappe.datetime.now_datetime());
            frm.refresh_field('blank_dt');
        }
    },
    save_weight: function (frm) {
        if (!frm.doc.ship_type && !frm.doc.scale_item) {
            frappe.msgprint("未选择物流计量单，则需要输入物流计量单类型以创建新物流单");
            return;
        }
        frappe.call({
            method: "shipping_management.shipping_management.doctype.serial_port_reader.serial_port_reader.save_weight",
            args: {
                "scale_item": frm.doc.scale_item,
                "gross_weight": frm.doc.gross_weight,
                "gross_dt": frm.doc.gross_dt,
                "blank_weight": frm.doc.blank_weight,
                "blank_dt": frm.doc.blank_dt,
                "net_weight": frm.doc.net_weight,
                "pot": frm.doc.pot,
                "type": frm.doc.ship_type,
                "market_segment": frm.doc.market_segment,
                "vehicle": frm.doc.vehicle,
                "item_code": frm.doc.item_code,
            },
            callback: function (r) {
                if (r.message.status == 'success') {
                    if(r.message.scale_item){
                        frappe.msgprint("保存成功。新物流计量单号为：" + r.message.scale_item);
                    }
                    else{
                        frappe.msgprint("保存成功");
                    }
                }
                else {
                    frappe.msgprint(r.message);
                }
            }
        });
    },
    clear: function (frm) {
        frm.doc.scale_item = "";
        frm.doc.gross_weight = 0;
        frm.doc.gross_dt = "";
        frm.doc.blank_weight = 0;
        frm.doc.blank_dt = "";
        frm.doc.net_weight = 0;
        frm.doc.driver = "";
        frm.doc.item_code = "";
        frm.doc.vehicle = "";
        frm.refresh();
    },
    ship_type: function (frm) {
        //when ship_type is OUT, make the verification code field mandatory
        if (frm.doc.ship_type == "OUT") {
            frm.set_df_property("verification_code", "reqd", 1);
        }
        else {
            frm.set_df_property("verification_code", "reqd", 0);
        }
    },
    verification_code: function (frm) {
        //when verification code is entered, using the code to get all document with the same code
        //check length of the value if length is 6 then contine
        if (frm.doc.verification_code.length == 6) {
            //get all document with the same verification code
            frappe.db.get_doc("Scale Item", null, { verification_code: frm.doc.verification_code }).then(doc => {
                if (doc) {
                    frm.doc.vehicle = doc.vehicle;
                    frm.doc.scale_item = doc.name;
                    frm.doc.ship_type = doc.type;
                    frm.doc.pot = doc.pot
                    frm.refresh();
                }
            });
        }
    },
    scale_item: function (frm) {
        if (!frm.doc.scale_item) {
            return;
        }
        frappe.db.get_doc("Scale Item", frm.doc.scale_item).then(doc => {
            if (doc.type != frm.doc.ship_type) {
                frm.doc.ship_type = doc.type;
                frappe.msgprint("物流计量单【类别】与当前选择不一致，已自动更改");
            }
            if (doc.pot != frm.doc.pot) {
                frm.doc.pot = doc.pot;
                frappe.msgprint("物流计量单【库位】与当前选择不一致，已自动更改");
            }
            if (doc.type == "IN") {
                frm.doc.gross_weight = doc.offload_gross_weight;
                frm.doc.gross_dt = doc.offload_gross_dt;
                frm.doc.blank_weight = doc.offload_blank_weight;
                frm.doc.blank_dt = doc.offload_blank_dt;
                frm.doc.net_weight = doc.offload_net_weight;
                frm.doc.driver = doc.driver;
                frm.doc.item_code = doc.item;
                frm.doc.ship_type = doc.type;
                frm.doc.vehicle = doc.vehicle;
                frm.doc.item_code = doc.item;
                frm.refresh();
            }
            else if (doc.type == "OUT") {
                frm.doc.gross_weight = doc.load_gross_weight;
                frm.doc.gross_dt = doc.load_gross_dt;
                frm.doc.blank_weight = doc.load_blank_weight;
                frm.doc.blank_dt = doc.load_blank_dt;
                frm.doc.net_weight = doc.load_net_weight;
                frm.doc.driver = doc.driver;
                frm.doc.item_code = doc.item;
                frm.doc.ship_type = doc.type;
                frm.doc.vehicle = doc.vehicle;
                frm.doc.item_code = doc.item;
                frm.refresh();
            }
        });
    },
    gross_weight: function (frm) {
        if (frm.doc.blank_weight && frm.doc.gross_weight) {
            frm.doc.net_weight = frm.doc.gross_weight - frm.doc.blank_weight;
            frm.refresh_field('net_weight');
        }
    },
    blank_weight: function (frm) {
        if (frm.doc.blank_weight && frm.doc.gross_weight) {
            frm.doc.net_weight = frm.doc.gross_weight - frm.doc.blank_weight;
            frm.refresh_field('net_weight');
        }
    }
});


async function openClose(frm) {
    // Is there a port open already?
    if (portOpen) {
        // Port's open. Call reader.cancel() forces reader.read() to return done=true
        // so that the read loop will break and close the port
        reader.cancel();
        console.log("attempt to close");
    } else {
        // No port is open so we should open one.
        // We write a promise to the global portPromise var that resolves when the port is closed
        portPromise = new Promise((resolve) => {
            // Async anonymous function to open the port
            (async () => {
                // Check to see if we've stashed a SerialPort object
                if (holdPort == null) {
                    // If we haven't stashed a SerialPort then ask the user to select one
                    port = await navigator.serial.requestPort();
                } else {
                    // If we have stashed a SerialPort then use it and clear the stash
                    port = holdPort;
                    holdPort = null;
                }
                // Grab the currently selected baud rate from the drop down menu
                var baudSelected = parseInt(frm.doc.baudrate);
                var buffersize = parseInt(frm.doc.buffersize);
                var databits = parseInt(frm.doc.databits);
                var stopbits = parseInt(frm.doc.stopbits);
                var parity = frm.doc.parity;
                var flowcontrol = frm.doc.flowcontrol;
                var stopchar = frm.doc.stopchar;
                var reverse = frm.doc.reverse;


                // Open the serial port with the selected baud rate
                await port.open({
                    baudRate: baudSelected,
                    bufferSize: buffersize,
                    dataBits: databits,
                    stopBits: stopbits,
                    parity: parity,
                    flowControl: flowcontrol
                });

                // Create a textDecoder stream and get its reader, pipe the port reader to it
                const textDecoder = new TextDecoderStream();
                reader = textDecoder.readable.getReader();
                const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);

                // If we've reached this point then we're connected to a serial port
                // Set a bunch of variables and enable the appropriate DOM elements
                portOpen = true;
                frm.fields_dict.screen.df.options = `
                <div style="background-color: black; color: white; height:100px; text-align: center;font-size:60px">
                    <p>------</p>
                </div>`;
                frm.fields_dict.screen.refresh();
                frm.doc.port_status = "Connected";
                frm.refresh_field('port_status');
                $(openCloseBtn).html('Close Port');
                // Serial read loop. We'll stay here until the serial connection is ended externally or reader.cancel() is called
                // It's OK to sit in a while(true) loop because this is an async function and it will not block while it's await-ing
                // When reader.cancel() is called by another function, reader will be forced to return done=true and break the loop
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) {
                        reader.releaseLock(); // release the lock on the reader so the owner port can be closed
                        break;
                    }
                    //frm.doc.term_window = frm.doc.term_window + value; // write the incoming string to the term_window textarea
                    //frm.refresh_field('term_window');
                    console.log(value);
                    if (reverse) {
                        value = Array.from(value).reverse().join("");
                    }
                    
                    if (stopchar) {
                        receivedData += value;
                        if (receivedData.includes(stopchar)){
                            console.log("Full Message Received:", receivedData);
                            //remove stopchar string from the received data
                            receivedData = receivedData.replace(stopchar, "");
                            displayInScreen(frm, receivedData);
                            receivedData = "";
                        }
                    }
                    else  {
                        //log 
                        receivedData = value;
                        //check the received data if it has + charactor
                        if (receivedData.includes("+")) {
                            console.log("Full Message Received:", receivedData);
                            displayInScreen(frm, receivedData);
                            receivedData = "";
                        }
                        
                    }
                }

                // If we've reached this point then we're closing the port
                // first step to closing the port was releasing the lock on the reader
                // we did this before exiting the read loop.
                // That should have broken the textDecoder pipe and propagated an error up the chain
                // which we catch when this promise resolves
                await readableStreamClosed.catch(() => {
                    /* Ignore the error */
                });
                // Now that all of the locks are released and the decoder is shut down, we can close the port
                await port.close();

                // Set a bunch of variables and disable the appropriate DOM elements
                portOpen = false;
                $(openCloseBtn).html('Open Port');
                frm.doc.port_status = "Disconnected";
                frm.refresh_field('port_status');
                console.log("port closed");
                receivedData = "";
                frm.fields_dict.screen.df.options = `
                <div style="background-color: black; color: white; height:100px; text-align: center;font-size:60px">
                    <p>请点击“打开端口”</p>
                </div>`;
                frm.fields_dict.screen.refresh();
                // Resolve the promise that we returned earlier. This helps other functions know the port status
                resolve();
            })();
        });
    }

    return;
}



function clearTerminal(frm) {
    // Logic to clear the terminal field
    frm.set_value('term_window', ''); // assuming 'term_window' is a field in your DocType
    frm.refresh_field('term_window');
}

function displayInScreen(frm, receivedData) {
    // add regular expression to the serial port reader setting.e.g. /(\d+\.\d+|\d+)/

/*     function extractWeight(data, pattern) {
        // Create a RegExp object using the pattern string
        const regex = new RegExp(pattern);
        const match = data.match(regex);
    
        if (match) {
            // Convert the matched string to an integer
            const weight = parseInt(match[1], 10);
            return weight + ' kg';
        } else {
            // Handle cases where no match is found
            return 'No valid weight found';
        }
    }
    
    const data = '」+00140001B「';
    const pattern = "\\+?(\\d+)01B"; // Note: double backslashes are used for escaping
    const weight = extractWeight(data, pattern);
    console.log(weight); // Output should be 1400 kg
     */

    const pattern = new RegExp(frm.doc.regexp);
    const match = receivedData.match(pattern);
    if (match) {
        const number = parseFloat(match[1]);
        frm.fields_dict.screen.df.options = `
                            <div style="background-color: black; color: white; height:100px; text-align: center; font-size:60px">
                                <p>${number}</p>
                            </div>`;
        frm.fields_dict.screen.refresh();

    }
}

function print_html_label(html_content) {
    // Creating new window to print
    var w = window.open('', '_blank');

    // Inserting the html content to new window
    w.document.write(html_content);

    // Executing print command
    w.document.close(); // necessary for IE >= 10
    w.focus(); // necessary for IE >= 10

    // Check if window is loaded
    w.onload = function () {
        w.print();
        window.addEventListener("afterprint", function () {
            w.close();
        }, false);
        //w.close();
    };
}
//get date time in local timezone with format yyyy-mm-dd hh-mm-ss
function get_date_time() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    if (month < 10) month = '0' + month;
    var day = date.getDate();
    if (day < 10) day = '0' + day;
    var hour = date.getHours();
    if (hour < 10) hour = '0' + hour;
    var minute = date.getMinutes();
    if (minute < 10) minute = '0' + minute;
    var second = date.getSeconds();
    if (second < 10) second = '0' + second;
    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}