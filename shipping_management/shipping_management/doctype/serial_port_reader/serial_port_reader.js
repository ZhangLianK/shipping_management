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
	

	refresh: function(frm) {
		frm.set_query("scale_item", function() {
			return {
				filters: {
					"status": ['not in', ['6 已完成', '9 已取消']],
					"docstatus": 1 ,
					"vehicle": frm.doc.vehicle,
					"type":frm.doc.ship_type
				}
			};
		});
		frm.set_query("warehouse", function() {
			return {
				filters: {
					is_group: 1
				}
			};
		});
		frm.set_query("pot", function() {
			return {
				filters: {
					is_group: 0,
					"parent_warehouse": frm.doc.warehouse
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


        frm.add_custom_button('Print Label', function() {
            // Action when button is clicked
            var doc = frm.doc;

            // Prepare your HTML content with real data
            var html_content = `
            <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/html">
    <head>
        <title>称重计量单</title>
        <style>
            body {
                margin:auto;
                width: 210mm;
                height:93mm;
            }
            table, th, td {
                border: 1px solid black;
                border-collapse: collapse;
            }
            th {
                width: 20%;
                padding: 10px;
                text-align: left;
            }
            td {
                width: 30%;
                padding: 10px;
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
                margin-top: 10px;
            }
        </style>
    </head>
    <body>

    <div class="header">
        <div style="float: left;"><h3 stype ="text-align: right">称重计量单</h3>
                        <h4 stype ="text-align: right">{}</h4>

        </div>
        <div style="float: right;">
            <p style="text-align: right;">单号: {}</p>
            <p style="text-align: right;">{}</p>
        </div>
    </div>
    <table style="width:100%">
      <tr>
        <th>车号</th>
        <td>{}</td>
        <th>毛重</th>
        <td>{}</td>
      </tr>
      <tr>
        <th>货名</th>
        <td>{}</td>
              <th>毛重时间</th>
        <td>{}</td>

      </tr>
      <tr>
        <th>发货单位</th>
        <td>______</td>

        <th>皮重</th>
        <td>{}</td>
      </tr>
      <tr>
        <th>收货单位</th>
        <td>______</td>
              <th>皮重时间</th>
        <td>{}</td>
      </tr>
      <tr>
        <th>打印时间</th>
        <td>{}</td>
            <th>净重</th>
        <td>{}</td>
      </tr>
    </table>

    <div class="signature">
        <p style="float: left;">过磅员: {}</p>
        <p style="float: right">司机: ________</p>
    </div>

    </body>
    </html>`;

            // Replace placeholders with actual data from the form
            html_content = html_content.replace('{}', doc.name); // repeat for other fields

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
	gross_weight_btn: function(frm) {
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
			frm.set_value('gross_weight', match[0]/1000);
			frm.refresh_field('gross_weight');

			// Update the 'timestamp' field with the current time
			frm.set_value('gross_dt', frappe.datetime.now_datetime());
			frm.refresh_field('gross_dt');
		}
	},
	btn_blank_weight: function(frm) {
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
			frm.set_value('blank_weight', match[0]/1000);
			frm.refresh_field('blank_weight');

			// Update the 'timestamp' field with the current time
			frm.set_value('blank_dt', frappe.datetime.now_datetime());
			frm.refresh_field('blank_dt');
		}
	},
	save_weight: function(frm) {
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
			},
			callback: function(r) {
				if(r.message=='success') {
					frappe.msgprint("保存成功");
				}
				else {
					frappe.msgprint(r.message);
				}
			}
		});
	},
	scale_item: function(frm) {
		frappe.db.get_doc("Scale Item", frm.doc.scale_item).then(doc => {
			if (doc.type=="IN") {
				frm.doc.gross_weight=doc.offload_gross_weight;
				frm.doc.gross_dt=doc.offload_gross_dt;
				frm.doc.blank_weight=doc.offload_blank_weight;
				frm.doc.blank_dt=doc.offload_blank_dt;
				frm.doc.net_weight=doc.offload_net_weight;
				frm.refresh();
			}
			else if (doc.type=="OUT") {
				frm.doc.gross_weight=doc.load_gross_weight;
				frm.doc.gross_dt=doc.load_gross_dt;
				frm.doc.blank_weight=doc.load_blank_weight;
				frm.doc.blank_dt=doc.load_blank_dt;
				frm.doc.net_weight=doc.load_net_weight;
				frm.refresh();
			}
		});
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
				var parity = parseInt(frm.doc.parity);
				var flowcontrol = parseInt(frm.doc.flowcontrol);


                // Open the serial port with the selected baud rate
                await port.open({ baudRate: baudSelected,
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
                    frm.doc.term_window = frm.doc.term_window + value; // write the incoming string to the term_window textarea
                    frm.refresh_field('term_window');
                    console.log(value);
                    receivedData += value;
                    if (receivedData.includes('\n')) {
                        console.log("Full Message Received:", receivedData);
                        displayInScreen(frm,receivedData);
                        receivedData = "";
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

function displayInScreen(frm,receivedData) {
        const pattern = /(\d+\.\d+|\d+)/;
        const match = receivedData.match(pattern);
        if (match) {
            const number = parseFloat(match[0]);
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
    w.onload = function() {
        w.print();
        //w.close();
    };
}
