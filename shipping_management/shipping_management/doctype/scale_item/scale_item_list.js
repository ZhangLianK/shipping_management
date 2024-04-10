// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt

let default_company = frappe.defaults.get_user_default("company");

frappe.listview_settings['Scale Item'] = {
    before_render() {
        $('.container').css("max-width", "100%");
        $('.container.page-body').css("max-width", "100%");
    },
    hide_name_column: true,
    has_indicator_for_draft: true,
    
	get_indicator: function (doc) {
	    
	    if (doc.docstatus === 'Cancelled'){
            return [__("9 已取消"), "grey", "status,=,9 已取消"];
        } else if (doc.status === "0 新配") {
            return [__("0 新配"), "red", "status,=,0 新配"];
        } else if (doc.status === "1 已配罐") {
            return [__("1 已配罐"), "light blue", "status,=,1 已配罐"];
        } else if (doc.status === "2 正在装货") {
            return [__("2 正在装货"), "yellow", "status,=,2 正在装货"];
        } else if (doc.status === "3 已装货") {
            return [__("3 已装货"), "yellow", "status,=,3 已装货"];
        } else if (doc.status === "4 正在卸货") {
            return [__("4 正在卸货"), "yellow", "status,=,4 正在卸货"];
        } else if (doc.status === "5 已卸货") {
            return [__("5 已卸货"), "green", "status,=,5 已卸货"];
        } else if (doc.status === "6 已完成") {
            return [__("6 已完成"), "grey", "status,=,6 已完成"];
        } else if (doc.status === "9 已取消" || doc.docstatus=== 2) {
            return [__("9 已取消"), "grey", "status,=,9 已取消"];
        } 
    },
    //add a button to the list view
    onload: function (listview) {
        //listview.page.set_filter('company', default_company);
        frappe.route_options = {
            "company": default_company,
            "status": ["not in", ["9 已取消", "6 已完成"]],
            // "date": frappe.datetime.get_today(),
        };
        listview.page.add_actions_menu_item(__("批量更新送货信息"), function () {
            //get all selected scale items
            let selected_items = listview.get_checked_items();
            if (selected_items.length === 0) {
                frappe.msgprint(__("请选择至少一条记录"));
                return;
            }
            //create a dialo to update the to_addr and order_notes
            let dialog = new frappe.ui.Dialog({
                title: __("批量更新送货信息"),
                fields: [
                    {
                        fieldname: "to_addr",
                        label: __("送货地"),
                        fieldtype: "Data",
                        reqd:true,
                    },
                    {
                        fieldname: "order_notes",
                        label: __("订单备注"),
                        fieldtype: "Data",
                        reqd:true,
                    },
                ],
                primary_action_label: __("更新"),
                primary_action(values) {
                    //update the status of all selected items
                    frappe.call({
                        method: "shipping_management.shipping_management.doctype.scale_item.scale_item.update_to_addr",
                        args: {
                            scale_items: selected_items,
                            to_addr: values.to_addr,
                            order_notes: values.order_notes,
                        },
                        callback: function (r) {
                            if (r.message) {
                                if(r.message.status === 'error'){
                                    frappe.msgprint(r.message.message);
                                    return;
                                }
                                frappe.msgprint(__("更新成功"));
                                dialog.hide();
                                listview.refresh();
                                //clear the selected items to uncheck
                                listview.clear_checked_items();
                            }
                        },
                    });
                }
            });
            //add .btn class to checkbox
            
            dialog.show();
        });

        //add another button to update warehouse 
        listview.page.add_actions_menu_item(__("批量更新罐（库位）"), function () {
            //get all selected scale items
            let selected_items = listview.get_checked_items();
            if (selected_items.length === 0) {
                frappe.msgprint(__("请选择至少一条记录"));
                return;
            }
            //create a dialo to update the to_addr and order_notes
            let dialog = new frappe.ui.Dialog({
                title: __("批量更新罐（库位）"),
                fields: [
                    {   
                        fieldname:"stock_in",
                        label:__("入库"),
                        fieldtype:"Check",
                        default:0,
                    },
                    {
                        fieldname: "stock_out",
                        label: __("出库"),
                        fieldtype: "Check",
                        default:0,
                    },

                    {
                        fieldname: "pot",
                        label: __("罐(库位)"),
                        fieldtype: "Link",
                        options: "Warehouse",
                        reqd:true,
                    },
                ],
                primary_action_label: __("更新"),
                primary_action(values) {
                    //get the type with stock_in or stock_out
                    let type ='';
                    if (values.stock_in === 1){
                        type = 'IN';
                    }
                    if (values.stock_out === 1){
                        type = 'OUT';
                    }
                    if (!type){
                        frappe.msgprint(__("请选择入库或出库"));
                        return;
                    }
                    //update the status of all selected items
                    frappe.call({
                        method: "shipping_management.shipping_management.doctype.scale_item.scale_item.update_warehouse",
                        args: {
                            scale_items: selected_items,
                            warehouse: values.pot,
                            type:type,
                        },
                        callback: function (r) {
                            if (r.message) {
                                if(r.message.status === 'error'){
                                    frappe.msgprint(r.message.message);
                                    return;
                                }
                                frappe.msgprint(__("更新成功"));
                                dialog.hide();
                                listview.refresh();
                                //clear the selected items to uncheck
                                listview.clear_checked_items();
                            }
                        },
                    });
                }
            });
            //add .btn class to checkbox
            dialog.$wrapper.find('.checkbox').addClass('btn');
            dialog.$wrapper.find('.checkbox').addClass('btn-secondary');
            dialog.$wrapper.find('.checkbox.btn').click(function(){
                $('.form-column .input-area :checkbox').prop('checked', false)
                $('.form-column .btn').css('background-color', 'white');
                $(this).find('.input-area :checkbox')[0].checked = !$(this).find('.input-area :checkbox')[0].checked
                $(this).css('background-color', $(this).find('.input-area :checkbox')[0].checked ? 'lightblue' : 'white');
            }
            );
            
            dialog.show();
        });


        listview.page.add_actions_menu_item(__("批量更新物流计划"), function () {
            //get all selected scale items
            let selected_items = listview.get_checked_items();
            if (selected_items.length === 0) {
                frappe.msgprint(__("请选择至少一条记录"));
                return;
            }
            //create a dialo to update the to_addr and order_notes
            let dialog = new frappe.ui.Dialog({
                title: __("批量更新物流计划"),
                fields: [
                    {
                        fieldname: "ship_plan",
                        label: __("物流计划"),
                        fieldtype: "Link",
                        options: "Ship Plan",
                        reqd:true,
                    },
                ],
                primary_action_label: __("更新"),
                primary_action(values) {
                    frappe.call({
                        method: "shipping_management.shipping_management.doctype.scale_item.scale_item.update_ship_plan",
                        args: {
                            scale_items: selected_items,
                            ship_plan: values.ship_plan
                        },
                        callback: function (r) {
                            if (r.message) {
                                if(r.message.status === 'error'){
                                    frappe.msgprint(r.message.message);
                                    return;
                                }
                                frappe.msgprint(__("更新成功"));
                                dialog.hide();
                                listview.refresh();
                                //clear the selected items to uncheck
                                listview.clear_checked_items();
                            }
                        },
                    });
                }
            });
            //add .btn class to checkbox
            dialog.$wrapper.find('.checkbox').addClass('btn');
            dialog.$wrapper.find('.checkbox').addClass('btn-secondary');
            dialog.$wrapper.find('.checkbox.btn').click(function(){
                $('.form-column .input-area :checkbox').prop('checked', false)
                $('.form-column .btn').css('background-color', 'white');
                $(this).find('.input-area :checkbox')[0].checked = !$(this).find('.input-area :checkbox')[0].checked
                $(this).css('background-color', $(this).find('.input-area :checkbox')[0].checked ? 'lightblue' : 'white');
            }
            );
            
            dialog.show();
        });
    },
};







