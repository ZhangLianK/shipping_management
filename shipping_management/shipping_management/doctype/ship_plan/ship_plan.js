// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt

frappe.ui.form.on('Ship Plan', {
    onload: function (frm) {
        
    },
    refresh: function (frm) {
        refresh_vehicle_plan(frm);
        //add a customer button to create a vehicle plan
        frm.add_custom_button(__('生成配车计划'), function () {
            frappe.route_options = {
                ship_plan: frm.doc.name,
                date: frappe.datetime.nowdate(),
                from_addr: frm.doc.from_addr,
                company: frm.doc.company
            };
            frappe.new_doc('Vehicle Plan Item');

        });


        frm.add_custom_button(__('新建报号单'), function () {
            frappe.route_options = {
                    ship_plan: frm.doc.name,
            };

            frappe.new_doc("Scale List");

        });

        frm.add_custom_button(__('物流计量单'), function () {
            frappe.route_options = {
                    ship_plan: frm.doc.name,
            };


            frappe.set_route('/query-report/物流明细报告');

        });

        // Setting a query for the Sales Order field within the Ship Plan Item child table
        frm.set_query('sales_order', 'plan_items', function (doc, cdt, cdn) {
            // You can access the child document if needed
            var child = locals[cdt][cdn];
            // Returning an object with filters for the Sales Order field
            return {
                filters: {
                    'docstatus': 1, // Example: Only show submitted Sales Orders
                    'status': ['not in', ['Completed', 'Closed']], // Filtering by status
                    'company': frm.doc.company // Assuming the Ship Plan has a 'company' field and you want to match it
                }
            };
        });
    },
    get_plan_item: function (frm) {
        frappe.db.get_list('Plan Item', {
            fields: ['name', 'date', 'type', 'status', 'sales_order', 'pot', 'v_qty', 'to_addr', 'order_note', 'bill_type', 'qty', 'vehicle_plan'],
            filters: {
                ship_plan: frm.doc.name
            },
            order_by: 'date desc, type asc, bill_type asc',
            limit: 'all'
        }).then(records => {
            update_child_table(frm, records);
        });
    },
    generate_vehicle_plan: function (frm) {
        // get all selected items in plan_items
        var selected_items = frm.doc.plan_items.filter(function (item) {
            return item.__checked;
        });
        if (selected_items.length == 0) {
            frappe.msgprint('请选择未配车的分量行项目');
            return;
        }
        //sum all selected items

        frappe.call({
            method: 'shipping_management.shipping_management.doctype.ship_plan.ship_plan.generate_vehicle_plan',
            args: {
                plan_items: selected_items,
                ship_plan: frm.doc.name
            },
            callback: function (r) {
                if (r.message == 'success') {
                    refresh_vehicle_plan(frm);
                }
            }
        });
    },
    get_vehicle_plan : function(frm){
        refresh_vehicle_plan(frm);
    }
});

function refresh_vehicle_plan(frm) {
    frappe.db.get_list('Vehicle Plan Item', {
        fields: ['date', 'req_qty', 'status', 'req_qty', 'assigned_qty', 'plan_desc', 'from_addr', 'name','transporter'],
        filters: {
            ship_plan: frm.doc.name
        },
        order_by: 'date desc',
        limit: 'all'
    }).then(records => {
        frm.clear_table('vehicle_plans');
        records.forEach(record => {
            frm.add_child('vehicle_plans', {
                date: record.date,
                req_qty: record.req_qty,
                status: record.status,
                assigned_qty: record.assigned_qty,
                plan_desc: record.plan_desc,
                from_addr: record.from_addr,
                vehicle_plan: record.name,
                transporter: record.transporter
            });
        });
        frm.refresh_field('vehicle_plans');
    });
}

function update_child_table(frm, records) {
    frm.clear_table('plan_items');
    frm.clear_table('plan_items_v');
    records.forEach(record => {
        if (record.vehicle_plan) {
            if (frm.doc.plan_items_v.length == 0) {
                frm.add_child('plan_items_v', {
                    date: record.date,
                });
                frm.add_child('plan_items_v', {
                    date: record.date,
                    type: record.type,
                    status: record.status,
                    sales_order: record.sales_order,
                    pot: record.pot,
                    v_qty: record.v_qty,
                    to_addr: record.to_addr,
                    order_note: record.order_note,
                    plan_item: record.name,
                    bill_type: record.bill_type,
                    qty: record.qty
                });
            } else {
                if (frm.doc.plan_items_v[frm.doc.plan_items_v.length - 1].date != record.date) {
                    frm.add_child('plan_items_v', {
                        date: record.date,
                    });
                    frm.add_child('plan_items_v', {
                        date: record.date,
                        type: record.type,
                        status: record.status,
                        sales_order: record.sales_order,
                        pot: record.pot,
                        v_qty: record.v_qty,
                        to_addr: record.to_addr,
                        order_note: record.order_note,
                        plan_item: record.name,
                        bill_type: record.bill_type,
                        qty: record.qty
                    });

                } else {
                    frm.add_child('plan_items_v', {
                        date: record.date,
                        type: record.type,
                        status: record.status,
                        sales_order: record.sales_order,
                        pot: record.pot,
                        v_qty: record.v_qty,
                        to_addr: record.to_addr,
                        order_note: record.order_note,
                        plan_item: record.name,
                        bill_type: record.bill_type,
                        qty: record.qty
                    });
                }
            }
        }
        else {
            // Create a new row in the child table plan_items, when come to another date insert a blank row to separate the dates
            if (frm.doc.plan_items.length == 0) {
                frm.add_child('plan_items', {
                    date: record.date,
                });
                frm.add_child('plan_items', {
                    date: record.date,
                    type: record.type,
                    status: record.status,
                    sales_order: record.sales_order,
                    pot: record.pot,
                    v_qty: record.v_qty,
                    to_addr: record.to_addr,
                    order_note: record.order_note,
                    plan_item: record.name,
                    bill_type: record.bill_type,
                    qty: record.qty
                });
            } else {
                if (frm.doc.plan_items[frm.doc.plan_items.length - 1].date != record.date) {
                    frm.add_child('plan_items', {
                        date: record.date,
                    });
                    frm.add_child('plan_items', {
                        date: record.date,
                        type: record.type,
                        status: record.status,
                        sales_order: record.sales_order,
                        pot: record.pot,
                        v_qty: record.v_qty,
                        to_addr: record.to_addr,
                        order_note: record.order_note,
                        plan_item: record.name,
                        bill_type: record.bill_type,
                        qty: record.qty
                    });

                } else {
                    frm.add_child('plan_items', {
                        date: record.date,
                        type: record.type,
                        status: record.status,
                        sales_order: record.sales_order,
                        pot: record.pot,
                        v_qty: record.v_qty,
                        to_addr: record.to_addr,
                        order_note: record.order_note,
                        plan_item: record.name,
                        bill_type: record.bill_type,
                        qty: record.qty
                    });
                }
            }
        }
    });
    frm.refresh_field('plan_items');
    frm.refresh_field('plan_items_v');
}