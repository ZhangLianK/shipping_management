frappe.ready(function () {
	
	// bind events here
	console.log("Ready");
	$(".web-form-footer .discard-btn")[0].innerHTML = '返回';
	$(".web-footer > .container").remove();

	//add custom css style to form-control and button
	$(".form-control").css("font-size", "20px");
	$(".btn").css("font-size", "20px");


	frappe.web_form.on("scale_item", function (field, value) {
		console.log("scale_item field changed");
		//get the scale_item's other field value
		frappe.call({
			method: "shipping_management.shipping_management.web_form.scale_load.scale_load.get_scale_item_load",
			args: {
				"scale_item": value
			},
			callback: function (r) {
				console.log("r.message: " + r.message);
				//set the scale_item's other field value
				frappe.web_form.set_value("load_gross_weight", r.message.load_gross_weight);
				frappe.web_form.set_value("load_net_weight", r.message.load_net_weight);
				frappe.web_form.set_value("load_blank_weight", r.message.load_blank_weight);
			}
		});
	});
	//when the whole document is ready check if scale_item is set
	$(document).ready(function () {
		console.log("Document Ready");
		

		frappe.web_form.handle_success = function (data) {
			// TODO: remove this (used for payments app)
			if (this.accept_payment && !this.doc.paid) {
				window.location.href = data;
			}
	
			if (!this.is_new) {
				$(".success-title").text(__("Updated"));
				$(".success-message").text(__("Your form has been successfully updated"));
			}
	
			$(".web-form-container").hide();
			$(".success-page").removeClass("hide");
			//get the url from div class="success_url_message"
			let success_url = document.querySelector(".success_url_message a").href;
			if (!this.success_url) {
				this.success_url = success_url;
			}
			if (this.success_url) {
				frappe.utils.setup_timer(5, 0, $(".time"));
				setTimeout(() => {
					window.location.href = this.success_url;
				}, 5000);
			} else {
				this.render_success_page(data);
				

			}
		}
		
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

	//discard action
	frappe.web_form.on("load_image_upload", function (field, value) {
		//add waiting dialog
		console.log("load_image_upload changed");
		//get the value of the field
		var load_image_upload_value = frappe.web_form.get_value("load_image_upload");
		var scale_item = frappe.web_form.get_value("scale_item");
		console.log("load_image_upload_value: " + load_image_upload_value);
			//if the value is not null, then set the field read only
			frappe.realtime.on(scale_item, (data) => {
				console.log(data)
				if (data.progress == data.total){
					frappe.hide_progress();
				}
					
				else {
					frappe.show_progress('OCR', data.progress, data.total, '识别中请稍后......');
				}
			});

			if (load_image_upload_value) {
				frappe.realtime.on('image_ocr', (data) => {
					console.log(data)
					frappe.show_progress('OCR', data.progress, data.total, '识别中请稍后......');
				});
				frappe.call({
					method: "shipping_management.shipping_management.web_form.scale_load.scale_load.ocr_image",
					args: {
						"load_image_upload_value": load_image_upload_value,
						"scale_item": scale_item
					},
					callback: function (r) {
						console.log("save_image callback");
						console.log(r);
						//if the response is success then assign value to the field, else show error message
						if (r.message) {
							console.log("r.message: " + r.message);
							//set the value of the field
							if (r.message._Tare >1000){
								frappe.web_form.set_value("load_blank_weight", r.message._Tare/1000);
								frappe.web_form.set_value("load_gross_weight", r.message._ToughWeight/1000);
								frappe.web_form.set_value("load_net_weight", r.message._NetWeight/1000);
							}
						}
						else {
							console.log("r.message is null");
						}
					}
				});
			}
			else {
				console.log("load_image_upload_value is null");
			}

	});

})
