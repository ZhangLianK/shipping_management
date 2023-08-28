// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt

frappe.ui.form.on('Scale Item', {

    refresh: function (frm) {
        //set status field to 0 when doc is new
        if (frm.is_new()) {
            frm.set_value('status', '0 新配');
        }
        // remove purchsae receipt and delivery note and transport fee field value when doc is new
        if (frm.is_new()) {
            frm.set_value('purchase_receipt', '');
            frm.set_value('delivery_note', '');
            frm.set_value('transport_fee', '');
            frm.set_value('load_net_weight', '');
            frm.set_value('offload_net_weight', '');
            frm.set_value('load_gross_weight', '');
            frm.set_value('offload_gross_weight', '');
            frm.set_value('load_blank_weight', '');
            frm.set_value('offload_blank_weight', '');
            frm.set_value('load_gross_dt', '');
            frm.set_value('offload_gross_dt', '');
            frm.set_value('load_blank_dt', '');
            frm.set_value('offload_blank_dt', '');
        }


        // set filter for pot field selection
        frm.set_query('pot', function () {
            return {
                filters: {
                    'company': frm.doc.company
                }
            };
        });
        // set filter for purchase order field selection
        frm.set_query('purchase_order', function () {
            return {
                filters: {
                    'item': frm.doc.item,
                    'company': frm.doc.company,
                    'docstatus': 1,
                    'status': ['not in', ['Closed', 'Completed', 'To Bill', 'Cancelled']]
                }
            };
        });
        //set filter for transporter, fitler the supplier by is_transporter field
        frm.set_query('transporter', function () {
            return {
                filters: {
                    'is_transporter': 1
                }
            };
        });
        // read only if purchase receipt or delivery note is created
        if (frm.doc.purchase_receipt || frm.doc.delivery_note) {
            frm.set_df_property('get_pot', 'hidden', 1);
            frm.set_df_property('pot', 'read_only', 1);
        }
        // add custom button to complete the scale item
        if ((frm.doc.status == '5 已卸货' && frm.doc.type == 'IN' && frm.doc.purchase_receipt)
            || (frm.doc.status == '5 已卸货' && frm.doc.type == 'OUT' && frm.doc.delivery_note)
            || (frm.doc.status == '5 已卸货' && frm.doc.type == 'DIRC' && frm.doc.purchase_receipt) && frm.doc.delivery_note) {
            frm.add_custom_button(__('Complete'), function () {
                frm.set_value('status', '6 已完成')
                    .then(() => {
                        frm.save('Update');
                    });
            });
        }
        // add custom button to create purchase receipt
        if (frm.doc.docstatus == 1 && (frm.doc.type == 'IN' || frm.doc.type == 'DIRC')) {

            frm.add_custom_button(__('Create Purchase Receipt'), function () {
                if (!frm.doc.pot && frm.doc.type == 'IN') {

                    frappe.throw(__('无入罐信息！'));

                }
                else if (frm.is_dirty()) {
                    frappe.throw(__('请先保存！'));
                }
                else {
                    if (frm.doc.purchase_receipt) {
                        frappe.throw(__('已经创建入库单，请勿多次创建！请检查已经创建的关联入库单！'));
                    }

                    else {
                        frappe.model.open_mapped_doc({
                            method: "shipping_management.shipping_management.doctype.scale_item.scale_item.make_purchase_receipt",
                            frm: cur_frm,
                            freeze_message: __("Creating Purchase Receipt ...")
                        })
                    }
                }
            });
        }

        // add custom button to create delivery note
        if (!frm.is_new() && frm.doc.docstatus !== 2 && (frm.doc.type == 'OUT' || frm.doc.type == 'DIRC')) {
            frm.add_custom_button(__('Create Delivery Note'), function () {
                if (!frm.doc.pot && frm.doc.type == 'OUT') {
                    frappe.throw(__('无出罐信息！'));
                }
                else if (!frm.doc.purchase_receipt && frm.doc.type == 'DIRC') {
                    frappe.throw(__('无入库单,无法创建出库单！'));
                }
                else if (frm.is_dirty()) {
                    frappe.throw(__('请先保存！'));
                }
                else {
                    if (frm.doc.delivery_note) {
                        frappe.throw(__('已经创建出库单，请勿多次创建！请检查已经创建的出库单！'));
                    }
                    else {
                        var currentDate = new Date();
                        var formattedDate = frappe.format(currentDate, { fieldtype: "Date" });
                        var delivery_dates = [formattedDate];
                        frappe.model.open_mapped_doc({
                            method: "shipping_management.shipping_management.doctype.scale_item.scale_item.make_delivery_note",
                            frm: frm,
                            freeze_message: __("Creating Delivery Note ...")

                        })

                    }
                }
            });
        }
    },
    get_pot: function (frm) {
        class MultiSelectDialogExt extends frappe.ui.form.MultiSelectDialog {

            make() {
                let me = this;
                this.page_length = 20;
                this.start = 0;
                let fields = this.get_primary_filters();

                // Make results area
                fields = fields.concat([
                    { fieldtype: "HTML", fieldname: "results_area" },
                    {
                        fieldtype: "Button", fieldname: "more_btn", label: __("More"),
                        click: () => {
                            this.start += 20;
                            this.get_results();
                        }
                    }
                ]);

                // Custom Data Fields
                if (this.data_fields) {
                    fields.push({ fieldtype: "Section Break" });
                    fields = fields.concat(this.data_fields);
                }

                let doctype_plural = this.doctype.plural();

                this.dialog = new frappe.ui.Dialog({
                    title: __("仓库选择"),
                    fields: fields,
                    primary_action_label: this.primary_action_label || __("Get Items"),
                    primary_action: function () {
                        let filters_data = me.get_custom_filters();
                        me.action(me.get_checked_values(), cur_dialog.get_values(), me.args, filters_data);
                    }
                });

                if (this.add_filters_group) {
                    this.make_filter_area();
                }

                this.$parent = $(this.dialog.body);
                this.$wrapper = this.dialog.fields_dict.results_area.$wrapper.append(`<div class="results"
			style="border: 1px solid #d1d8dd; border-radius: 3px; height: 300px; overflow: auto;"></div>`);

                this.$results = this.$wrapper.find('.results');
                this.$results.append(this.make_list_row());

                this.args = {};

                this.bind_events();
                this.get_results();
                this.dialog.show();
                this.dialog.fields_dict.actual_qty.$wrapper.hide();
                this.dialog.fields_dict.ordered_qty.$wrapper.hide();
            }


        }


        if (!frm.doc.item) {
            return;
        }

        let d = new MultiSelectDialogExt({
            doctype: "Bin",
            target: cur_frm,
            setters: {
                item_code: frm.doc.item,
                warehouse: null,
                actual_qty: null,
                ordered_qty: null
            },
            add_filters_group: 0,

            get_query() {
                return {

                    filters: {
                        item_code: ['=', frm.doc.item]
                    }
                };
            },
            action(selections) {
                if (selections.length == 1) {
                    cur_frm.doc.pot = this.results.find(o => o.name === selections[0]).warehouse;
                    cur_frm.dirty();
                    cur_frm.refresh_field('pot');
                    this.dialog.hide();
                }
                else if (selections.length > 1) {
                    frappe.throw("无法选择多个仓库，请勾选单个仓库");
                }



            },
            primary_action_label: '确认',
        });

    },
    validate: function (frm) {
        if ((frm.doc.type == 'OUT' || frm.doc.type == 'DIRC') && !frm.doc.bill_type) {

            frappe.throw(__('【结算类型】未指定，请选择正确的结算类型'));
            frappe.validated = false;

        }
    }
});