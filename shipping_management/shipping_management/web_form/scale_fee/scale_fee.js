frappe.ready(function() {
	// bind events here
	console.log("Ready");
	$(".web-form-footer .discard-btn")[0].innerHTML = '返回';
	$(".web-footer > .container").remove();

	//get the scale_item's other field value
	frappe.web_form.on("scale_item", function (field, value) {
		console.log("scale_item field changed");
		//get the scale_item's other field value
		frappe.call({
			method: "shipping_management.shipping_management.web_form.scale_fee.scale_fee.get_scale_item_fee",
			args: {
				"scale_item": value
			},
			callback: function (r) {
				console.log("r.message: " + r.message);
				//set the scale_item's other field value
				frappe.web_form.set_value("tangbu", r.message.tangbu);
				frappe.web_form.set_value("fanfee", r.message.fanfee);
				frappe.web_form.set_value("yayunfee", r.message.yayunfee);
				frappe.web_form.set_value("fakuan", r.message.fakuan);
				frappe.web_form.set_value("gaosufee", r.message.gaosufee);
			}
		});
	});


	//when the whole document is ready check if scale_item is set
	$(document).ready(function () {
		console.log("Document Ready");
		//remove web-footer container div


		frappe.web_form.discard_form = function () {
			console.log("Discard form called");
			{
				//redirect the page to path /shipping_view/?scale_item=<scale_item>
				//get the scale_item value
				var scale_item_value = frappe.web_form.get_value("scale_item");
				console.log("scale_item_value: " + scale_item_value);
				//get the whole url from the browser
				var url = window.location.href;
				//get the domain from the url
				var domain = window.location.origin;

				//redirect to /shipping_view/?scale_item=<scale_item>
				window.location.href = domain + "/shipping_viewer?scale_item=" + scale_item_value;
			}
		}
		//if scale_item is set, then set the scale_item field
		scale_item_value = frappe.web_form.get_value("scale_item");
		if (scale_item_value) {
			console.log("scale_item is set");
			//set the the field read only
			frappe.web_form.set_df_property("scale_item", "read_only", 1);
		}
		else {
			console.log("scale_item is not set");
		}

		//add event listener so that when field load_image_upload is changed, then console log a message

	});
})