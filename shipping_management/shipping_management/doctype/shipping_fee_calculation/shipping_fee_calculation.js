// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt

frappe.ui.form.on('Shipping Fee Calculation', {
	 refresh: function(frm) {
		//add a button to refresh the scale item according to the ship plan
		frm.add_custom_button(__('刷新运单列表'), function() {
			refresh_ship_plan_fee(frm);
		}
		);

	 },
	 driver: function(frm) {
		//set from_date and to_date mandatory if driver is set
		if(frm.doc.driver){
			frm.set_df_property("from_date", "reqd", 1);
			frm.set_df_property("to_date", "reqd", 1);
		}
		else {
			frm.set_df_property("from_date", "reqd", 0);
			frm.set_df_property("to_date", "reqd", 0);
		}
	 }
});

function refresh_ship_plan_fee(frm){
	//check if both driver and ship_plan are set, if yes, popup error message
	if(frm.doc.driver && frm.doc.ship_plan){
		frappe.msgprint("司机和运输计划只能选择一个。");
		return;
	}
	//if driver is set, then from_date and to_date must be set
	if(frm.doc.driver && (!frm.doc.from_date || !frm.doc.to_date)){
		frappe.msgprint("按照司机查询和需要选择日期范围。");
		return;
	}
	//if both ship_plan and driver are not set, then popup error message
	if(!frm.doc.driver && !frm.doc.ship_plan){
		frappe.msgprint("司机和运输计划必须选择一个。");
		return;
	}

	frappe.call({
		method: "shipping_management.shipping_management.doctype.shipping_fee_calculation.shipping_fee_calculation.refresh_ship_plan_fee",
		args: {
			"ship_plan": frm.doc.ship_plan,
			"driver": frm.doc.driver,
			"from_date": frm.doc.from_date,
			"to_date": frm.doc.to_date
		},
		callback: function (r) {
			console.log("refresh_ship_plan callback");
			console.log(r);
			//if the response is success then assign value to the field, else show error message
			if (r.message) {
				console.log("r.message: " + r.message);
				//set the value of the field, the message is a list, loop every item and add to the child table scale_fees
				//clear the child table first
				frm.clear_table("scale_fees");
				let total = 0;
				//then add the new items
				$.each(r.message, function(i, d) {
					var scale_fee = frm.add_child("scale_fees");
					scale_fee.scale_item = d.name;
					scale_fee.vehicle = d.vehicle;
					scale_fee.driver = d.driver;
					scale_fee.days = d.days;
					scale_fee.tangbu = d.tangbu;
					scale_fee.fanfee = d.fanfee;
					scale_fee.yayunfee = d.yayunfee;
					scale_fee.fakuan = d.fakuan;
					scale_fee.mileage = d.mileage;
					scale_fee.to_dt = d.to_dt;
					scale_fee.from_dt = d.from_dt;
					total = d.tangbu + d.fanfee + d.yayunfee + d.fakuan;
				});
				//refresh the child table
				frm.doc.total = total;
				frm.refresh();
			}
			else {
				console.log("r.message is null");
			}
		}
	});
}