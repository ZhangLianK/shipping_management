// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt

frappe.ui.form.on('Scale Item', {

    refresh: function (frm) {
        

        //add a button to send sms message to driver
        if (frm.doc.driver) {
            let send_notification_load_offload = frm.add_custom_button(__('通知司机装卸货'), function () {
                console.log('send sms to driver');
                /* frappe.call({
                    method: 'shipping_management.shipping_management.doctype.scale_item.scale_item.send_notification_load_offload',
                    args: {
                        'driver': frm.doc.driver,
                    }
                }); */
            });
            // Get the button of "通知司机装卸货"
        //let send_notification_load_offload = frm.page.get_inner_group_button(__('通知司机装卸货'));

        // Add click event listener
        send_notification_load_offload.on('click', function () {
            // Disable the button
            send_notification_load_offload.prop('disabled', true);

            // Re-enable the button after 5 seconds
            setTimeout(function () {
                send_notification_load_offload.prop('disabled', false);
            }, 5000); // 5000 milliseconds = 5 seconds
        });
        }
        

        
        frm.add_custom_button('Print Label', function () {
            // Action when button is clicked
            var doc = frm.doc;

            // Prepare your HTML content with real data
            if (frm.doc.market_segment == '粮食') {
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
                width: 10%;
                padding-left: 1%;
                text-align: left;
            }
            td {
                width: 30%;
                padding-left: 1%;
                text-align: left;
            }
            .info {
                width: 10%;
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
                    width: 10%;
                    padding-left: 1%;
                    text-align: left;
                }
                td {
                    width: 30%;
                    padding-left: 1%;
                    text-align: left;
                }
                .info {
                    width: 10%;
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
            <p class="hd_txt">${doc.company ? doc.company : doc.plant}</p>

        </div>
        <div class = "shd">
            <p class = "shd_txt">单号: ${doc.scale_item}</p>
            <p class="shd_txt">【${doc.ship_type === 'IN' ? '入' : doc.ship_type === 'OUT' ? '出' : ''}】 ${doc.pot}</p>
        </div>
    </div>
    <table>
      <tr>
        <th>车号</th>
        <td>${doc.vehicle}</td>
        <th>毛重</th>
        <td>${doc.gross_weight}</td>
        <th>杂质</th>
        <td class = "info">${doc.zazhi ? doc.zazhi : ''}</td>
      </tr>
      <tr>
        <th>货名</th>
        <td>${doc.item_code}</td>
        <th>毛重时间</th>
        <td>${doc.gross_dt}</td>
        <th>容重</th>
        <td class = "info">${doc.rongzhong ? doc.rongzhong : ''}</td>
      </tr>
      <tr>
        <th>发货单位</th>
        <td>${doc.ship_type === 'IN' ? doc.from : frm.doc.company}</td>
        <th>皮重</th>
        <td>${doc.blank_weight}</td>
        <th>霉变</th>
        <td class = "info">${doc.meibian ? doc.meibian : ''}</td>
      </tr>
      <tr>
        <th>收货单位</th>
        <td>${doc.ship_type === 'OUT' ? doc.to : frm.doc.company}</td>
              <th>皮重时间</th>
        <td>${doc.blank_dt}</td>
        <th>水分</th>
        <td class = "info">${doc.shuifen ? doc.shuifen : ''}</td>
      </tr>
      <tr>
        <th>打印时间</th>
        <td>${get_date_time()}</td>
        <th>净重</th>
        <td>${doc.net_weight}</td>
        <th>价格</th>
        <td class = "info"></td>
      </tr>
    </table>

    <div class="signature">
        <p class="hd">过磅员: ${frappe.session.user_fullname}</p>
        <p class="shd">司机: _________________</p>
    </div>
    </div>
    </body>
    </html>`;
            }
        else if (frm.doc.market_segment == '宏赫-成品油') {
            var html_content = `
            <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/html" lang="zh" >
    <head>
        <title>称重计量单</title>
        <style>
            body {
                margin-top: 0.5rem;
                width: 210mm;
                height: 70mm;
                padding-left: 3%;
                padding-right: 3%;
            }
            table {
                width: 100%;
            }
            table, th, td {
                border: 0.1rem solid black;
                border-collapse: collapse;
                padding-top:1%;
                padding-bottom:1%;
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
                    margin-top: 0.5rem;
                    padding-left: 3%;
                    padding-right: 3%;
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
                    padding-top:1%;
                    padding-bottom:1%;
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
            <p class="hd_txt"></p>

        </div>
        <div class = "shd">
            <p class = "shd_txt">单号: ${doc.name}</p>
            <p class="shd_txt">【${doc.type === 'IN' ? '入' : doc.type === 'OUT' ? '出' : ''}】 ${doc.pot.split(' - ')[1]}</p>
        </div>
    </div>
    <table>
      <tr>
        <th>车号</th>
        <td>${doc.vehicle}</td>
        <th>毛重</th>
        <td>${doc.type === 'IN' ? doc.offload_gross_weight : doc.type === 'OUT' ? doc.load_gross_weight : ''}</td>
      </tr>
      <tr>
        <th>货名</th>
        <td></td>
              <th>毛重时间</th>
        <td>${doc.type === 'IN' ? doc.offload_gross_dt : doc.type === 'OUT' ? doc.load_gross_dt : ''}</td>

      </tr>
      <tr>
        <th>发货单位</th>
        <td>______</td>

        <th>皮重</th>
        <td>${doc.type === 'IN' ? doc.offload_blank_weight : doc.type === 'OUT' ? doc.load_blank_weight : ''}</td>
      </tr>
      <tr>
        <th>收货单位</th>
        <td>______</td>
              <th>皮重时间</th>
        <td>${doc.type === 'IN' ? doc.offload_blank_dt : doc.type === 'OUT' ? doc.load_blank_dt : ''}</td>
      </tr>
      <tr>
        <th>打印时间</th>
        <td>${get_date_time()}</td>
            <th>净重</th>
        <td>${doc.type === 'IN' ? doc.offload_net_weight : doc.type === 'OUT' ? doc.load_net_weight : ''}</td>
      </tr>
    </table>

    <div class="signature">
        <p class="hd">过磅员: ${frappe.session.user_fullname}</p>
        <p class="shd">司机: _________________</p>
    </div>
    </div>
    </body>
    </html>
            `;

        }
            else {
                var html_content = `
            <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/html" lang="zh" >
    <head>
        <title>称重计量单</title>
        <style>
            body {
                margin-top: 1rem;
                width: 210mm;
                height: 90mm;
                padding-right: 3%;
                padding-left: 3%;
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
                    padding-left: 3%;
                    padding-right: 3%;
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
            <p class="hd_txt"></p>

        </div>
        <div class = "shd">
            <p class = "shd_txt">单号: ${doc.scale_item}</p>
            <p class="shd_txt">【${doc.ship_type === 'IN' ? '入' : doc.ship_type === 'OUT' ? '出' : ''}】 ${doc.pot}</p>
        </div>
    </div>
    <table>
      <tr>
        <td>车号</td>
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
        <td>${doc.ship_type === 'IN' ? doc.from : ''}</td>

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
        <p class="hd">过磅员: ${frappe.session.user_fullname}</p>
        <p class="shd">司机: _________________</p>
    </div>
    </div>
    </body>
    </html>`;
            }
            // Replace placeholders with actual data from the form
            //html_content = html_content.replace('{}', doc.name); // repeat for other fields

            // Call the print function
            print_html_label(html_content);
        });


        //set the pot to company's default transit warehouse if the type is DIRC
        if (frm.doc.type == 'DIRC' && frm.doc.company) {
            frappe.db.get_value('Company', frm.doc.company, 'default_in_transit_warehouse', function (r) {
                frm.set_value('pot', r.default_transit_warehouse);
            });
        }

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
        if (frm.doc.market_segment == '成品油') {
        }
        if (frm.doc.market_segment == '粮食') {
            frm.set_query('purchase_order', function () {
                return {
                    filters: {
                        'schedule_date': ['>=', frappe.datetime.nowdate()],
                        'company': frm.doc.company,
                        'docstatus': 1,
                        'status': ['not in', ['Closed', 'Completed', 'Cancelled']],
                    }
                };
            });
        }
        
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
            || (frm.doc.status == '5 已卸货' && frm.doc.type == 'DIRC' && frm.doc.purchase_receipt && frm.doc.delivery_note)
            || (frm.doc.market_segment !='成品油')) {
            frm.add_custom_button(__('Complete'), function () {
                if (!frm.doc.price && frm.doc.market_segment == '成品油'){
                    frappe.throw(__('未输入运输价格！请输入运输价格后再进行完成操作！'));
                } 
                else {
                    frm.set_value('status', '6 已完成')
                    .then(() => {
                        frm.save('Update');
                    });            
                }
            });
        }
        // add custom button to create purchase receipt
        if (frm.doc.docstatus == 1 && (frm.doc.type == 'IN' || frm.doc.type == 'DIRC')) {

            frm.add_custom_button(__('Create Purchase Receipt'), function () {
                if (!frm.doc.pot && frm.doc.type == 'IN') {

                    frappe.throw(__('无【罐（库位）】信息！'));

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
    },
    load_gross_weight: function (frm) {
        if  (!frm.doc.load_gross_weight) {
            frm.set_value('load_net_weight', '');
            frm.refresh_field('load_net_weight');
        }
        if (frm.doc.load_gross_weight && frm.doc.load_blank_weight) {
            frm.set_value('load_net_weight', frm.doc.load_gross_weight - frm.doc.load_blank_weight);
            frm.refresh_field('load_net_weight');
        }
    },
    load_blank_weight: function (frm) {
        if (!frm.doc.load_blank_weight) {
            frm.set_value('load_net_weight', '');
            frm.refresh_field('load_net_weight');
        }
        if (frm.doc.load_gross_weight && frm.doc.load_blank_weight) {
            frm.set_value('load_net_weight', frm.doc.load_gross_weight - frm.doc.load_blank_weight);
            frm.refresh_field('load_net_weight');
        }
    },
    offload_gross_weight: function (frm) {
        if (!frm.doc.offload_gross_weight) {
            frm.set_value('offload_net_weight', '');
            frm.refresh_field('offload_net_weight');
        }
        if (frm.doc.offload_gross_weight && frm.doc.offload_blank_weight) {
            frm.set_value('offload_net_weight', frm.doc.offload_gross_weight - frm.doc.offload_blank_weight);
            frm.refresh_field('offload_net_weight');
        }
    },
    offload_blank_weight: function (frm) {
        if (!frm.doc.offload_blank_weight) {
            frm.set_value('offload_net_weight', '');
            frm.refresh_field('offload_net_weight');
        }
        if (frm.doc.offload_gross_weight && frm.doc.offload_blank_weight) {
            frm.set_value('offload_net_weight', frm.doc.offload_gross_weight - frm.doc.offload_blank_weight);
            frm.refresh_field('offload_net_weight');
        }
    },
    offload_net_weight: function (frm) {
        if (frm.doc.offload_gross_weight && frm.doc.offload_blank_weight) {
            if (frm.doc.offload_net_weight != frm.doc.offload_gross_weight - frm.doc.offload_blank_weight) {
                frappe.throw(__('卸货净重与毛重减皮重不符，请检查！'));
            }
        }
        if (frm.doc.offload_net_weight < 0) {
            frappe.throw(__('卸货净重不能为负数，请检查！'));
        }
    },
    load_net_weight: function (frm) {
        if (frm.doc.load_gross_weight && frm.doc.load_blank_weight) {
            if (frm.doc.load_net_weight != frm.doc.load_gross_weight - frm.doc.load_blank_weight) {
                frappe.throw(__('装货净重与毛重减皮重不符，请检查！'));
            }
        }
        if (frm.doc.load_net_weight < 0) {
            frappe.throw(__('装货净重不能为负数，请检查！'));
        }
    },
});


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
