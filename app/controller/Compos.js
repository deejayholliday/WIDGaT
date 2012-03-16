/*
This file is part of WIDGaT Toolkit

This work is licensed under a Creative Commons Attribution Non-Commercial ShareAlike 3.0 License

Contact:  http://arc.tees.ac.uk/
*/
Ext.define('WIDGaT.controller.Compos', {
	extend: 'Ext.app.Controller',
	
    models: ['Compo', 'Action', 'Attribute', 'Author', 'Dependency', 'Guidance', 'Theme'],
    stores: ['Compos', 'Actions', 'Attributes', 'Authors', 'Dependencies', 'Guidances', 'Themes'],
	
	views: [
        'compo.List'
    ],
	
    refs: [
        {ref: 'attributeList', selector: 'attrlist'},
        {ref: 'guidanceList', selector: 'guidancelist'},
        {ref: 'compoDataView', selector: 'compoDataView'},
        {ref: 'compoList', selector: 'compolist'},
        {ref: 'widgetView', selector: 'widgetview'},
        {ref: 'actionComboBox', selector: 'actioncombobox'},
        {ref: 'themeComboBox', selector: 'themecombobox'},
        {ref: 'guidanceList', selector: 'guidancelist'},
		{ref: 'outputTree', selector: '#outputTree'}
    ],

    init: function() {
    	var me = this;
		
        me.control({
            /*'compolist': {
            	render: me.onCompoListRender,
                selectionchange: me.onCompoSelectionChange
            },*/
            'compoDataView': {
            	itemclick: me.onCompoItemClick,
				itemmouseup: me.onCompoItemMouseUp,
				dragend: function(e) { alert(e); }
            },
			'compolist': {
				afterrender: me.onAfterCompoListRender,
				selected: me.onCompoSelected,
				deselected: me.onCompoDeselected
			},
			'#openButton': {
				click: function() {
					if(WIDGaT.debug) console.log(me.getAttributeList().getStore());
				}
			},
			'guidancelist': {
                itemclick: me.onGuidanceClick
			},
			'themecombobox': {
                select: me.onThemeSelect,
				beforerender: me.onThemeBeforeRender
			},
			'outputfield': {
                focus: function(cmp) { cmp.setRawValue(cmp.value); }
			},
			'actionpicker': {
                focus: function(cmp) { cmp.setRawValue(cmp.value);}
			}
        });
        
		me.getComposStore().on({
			scope: me,
			load : me.onComposStoreLoad
		});
		me.getAttributesStore().on({
			update: function(store, record) {
				if(WIDGaT.debug) console.log('WIDGaT.controller.Compos.onAttributesStoreUpdate()');
				if(WIDGaT.debug) console.log('Updated record, store:', record, store);
				
				var updatedCompo = WIDGaT.activeWidget.components().getById(record.get('widgat.model.compo_id'));
				
				if(record.get('type').toLowerCase() == 'action' || record.get('input')) {
					if(WIDGaT.debug) console.log("outputtree", me.getOutputTree());
					/*if(me.getOutputTree()) {
						if(WIDGaT.debug) console.log("hasSelection()", me.getOutputTree().getSelectionModel().hasSelection());
						if(WIDGaT.debug) console.log("getLastSelected", me.getOutputTree().getSelectionModel().getLastSelected());
					}*/
					var recordAction = record.get('widgat.model.compo_id') + '.' + record.get('shortName');
					var valueAction = record.get('value');
					
					var relatedPipe = WIDGaT.activeWidget.pipes().findRecord('from', recordAction)
					
					if(relatedPipe) {
						relatedPipe.set('to', valueAction);
					} else {
						relatedPipe = WIDGaT.activeWidget.pipes().findRecord('to', recordAction)
						if(relatedPipe) {
							relatedPipe.set('from', valueAction);
						}
					}
					
					if(relatedPipe) {
						var jsVal = new Object();
						jsVal.root = 'pipes['+ WIDGaT.activeWidget.pipes().indexOf(relatedPipe) +']';
						jsVal.from = relatedPipe.get('from');
						jsVal.to = relatedPipe.get('to');
						
						Ext.data.JsonP.request({
							url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
							params: {
								'verb': 'modify',
								'name': WIDGaT.activeWidget.get('id'),
								'value': Ext.JSON.encode(jsVal)
							},
							success: function(response) {
								if(WIDGaT.debug) console.log(response);
								//me.getActionWindow().close();
								me.getWidgetView().setSrc();
								
							},
							failure: function(response) {
								console.error(response);	
							}
						});
					} else {
						relatedPipe = Ext.create('WIDGaT.model.Pipe');
						if(record.get('type').toLowerCase() == 'action') {
							relatedPipe.set('to', valueAction);
							relatedPipe.set('from', recordAction);
						} else {
							relatedPipe.set('to', recordAction);
							relatedPipe.set('from', valueAction);
						}
						Ext.data.JsonP.request({
							url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
							params: {
								'verb': 'append-pipe',
								'name': WIDGaT.activeWidget.get('id'),
								'value': Ext.JSON.encode(relatedPipe.json4Serv())
							},
							success: function(response) {
								if(WIDGaT.debug) console.log(response);
								WIDGaT.activeWidget.pipes().add(relatedPipe);
								//me.getActionWindow().close();
								me.getWidgetView().setSrc();
								if(WIDGaT.debug) console.log("success me.getGuidanceList()", me.getGuidanceList());
								me.getGuidanceList().onBeforeRender();
								
							},
							failure: function(response) {
								console.error(response);	
							}
						});
					}
				}
				else {
				
					var indexOfParentComp = WIDGaT.activeWidget.components().indexOfId(record.get('widgat.model.compo_id'));
										
					var root = "components["+indexOfParentComp+"].attributes["+record.index+"]";

					var tmpO = record.json4Serv();
					tmpO.root = root;
										
					Ext.data.JsonP.request({
						url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
						params: {
							'verb': 'modify',
							'name': WIDGaT.activeWidget.get('id'),
							'value': Ext.JSON.encode(tmpO)
						},
						success: function(response) {
							me.getWidgetView().setSrc();
						},
						failure: function(response) {
							console.error(response);	
						}
					});
				
				}
			},
			datachanged: function(store, records) {
				if(WIDGaT.debug) console.log('attrStore.datachanged');
				store.suspendEvents();
				store.each(function(attr) {
					if(WIDGaT.debug) console.log('each attr',attr);
					
					if(attr.get('type').toLowerCase() == 'action') {
						if(WIDGaT.debug) console.log('registering customEditor for actions');
						if(WIDGaT.debug) console.log(me.getAttributeList().getDockedComponent('attributeToolbar'));
						
						var existingP = null;
						if( existingP = WIDGaT.activeWidget.pipes().findRecord('from', attr.get('widgat.model.compo_id') + '.' + attr.get('shortName'))) {
							attr.set('value', existingP.get('to'));  //don't set value here but when creating pipe so it doesn't trigger the update event on the store
						} else if( existingP = existingP = WIDGaT.activeWidget.pipes().findRecord('to', attr.get('widgat.model.compo_id') + '.' + attr.get('shortName'))) {
							attr.set('value', existingP.get('from'));
						}
						eval('Ext.apply(me.getAttributeList(), {'
							+'customEditors: {'
							+'	"' + attr.get('name') + '": Ext.create("WIDGaT.view.action.ActionPicker")'
							+'}'
						+'});');
					}
						
					if(attr.get('input')) {
						
						var existingP = null;
						if( existingP = WIDGaT.activeWidget.pipes().findRecord('from', attr.get('widgat.model.compo_id') + '.' + attr.get('shortName'))) {
							attr.set('value', existingP.get('to'));
						} else if( existingP = existingP = WIDGaT.activeWidget.pipes().findRecord('to', attr.get('widgat.model.compo_id') + '.' + attr.get('shortName'))) {
							attr.set('value', existingP.get('from'));
						}
						
						if(WIDGaT.debug) console.log('registering customEditor for inputs');
						
						eval('Ext.apply(me.getAttributeList(), {'
							+'customEditors: {'
							+'	"' + attr.get('name') + '": Ext.create("WIDGaT.view.attribute.OutputField")'
							+'}'
						+'});');
					}
					
				});
				store.resumeEvents();
			}
		});
    },
	
	onCompoSelected: function(cmp) {
		if(WIDGaT.debug) console.log('WIDGaT.controller.Compos.onCompoSelected()');
		if(WIDGaT.debug) console.log('selected comp from controller', cmp);
		//the following will throw errors if WIDGaT.activeWidget==WIDGaT.newWidget   otherwise  as if you click on useacaseButton while in debug mode
		if(WIDGaT.debug) console.log('Selected comp\'s attributes', WIDGaT.activeWidget.components().getById(cmp.id).attributes());
		WIDGaT.selectedCompo = WIDGaT.activeWidget.components().getById(cmp.id);
		this.getAttributeList().bind(WIDGaT.activeWidget.components().getById(cmp.id), this.getAttributesStore());
		this.getAttributeList().setTitle('Edit '+WIDGaT.selectedCompo.get('id'));
		this.getAttributeList().down('#toolBin').setDisabled(false);

		this.getThemeComboBox().bindStore(WIDGaT.activeWidget.components().getById(cmp.id).themes());
		this.getThemeComboBox().setValue(WIDGaT.selectedCompo.get('stylesheet'));
	},
	
	onCompoDeselected: function() {
		if(WIDGaT.debug) console.log('WIDGaT.controller.Compos.onCompoDeselected()');
		
		WIDGaT.selectedCompo = null;
		this.getAttributesStore().removeAll();
		this.getAttributeList().setTitle('Edit ');
		this.getAttributeList().down('#toolBin').setDisabled(true);
		this.getThemeComboBox().clearValue();
	},
	
	onGuidanceClick: function (view, record) {
		if(WIDGaT.debug) console.log('WIDGaT.controller.Compos.onGuidanceClick()');
		//the following will throw errors if WIDGaT.activeWidget==WIDGaT.newWidget   otherwise  as if you click on useacaseButton while in debug mode	
		if(WIDGaT.debug) console.log("guidance select", record);
		var cmpId;
		if(record.get('depth') == 1)
			cmpId = record.get('text');
		else
			cmpId = record.parentNode.get('text');
		
		WIDGaT.selectedCompo = WIDGaT.activeWidget.components().getById(cmpId);
		this.getAttributeList().bind(WIDGaT.activeWidget.components().getById(cmpId), this.getAttributesStore());
		this.getAttributeList().setTitle('Edit '+WIDGaT.selectedCompo.get('id'));
		this.getAttributeList().down('#toolBin').setDisabled(false);
		
		this.getWidgetView().frameElement.getDoc().dom.setSelected(cmpId);
		
		view.deselect(record);
	},
	
	onThemeSelect: function(cmb, records) {
		
		var me = this;
		WIDGaT.activeWidget.components().getById(records[0].get('widgat.model.compo_id')).set('stylesheet', records[0].get('file'));
		
		var tmpO = new Object();
		tmpO.root = 'components['+ WIDGaT.activeWidget.components().indexOfId(records[0].get('widgat.model.compo_id')) +']';
		tmpO.stylesheet = records[0].get('file');
		
		if(WIDGaT.debug) console.log('tmpO: ', tmpO);
		//will be modified to modify-component with id
		Ext.data.JsonP.request({
			url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
			params: {
				'verb': 'modify',
				'name': WIDGaT.activeWidget.get('id'),
				'value': Ext.JSON.encode(tmpO)
			},
			success: function(response) {
				if(WIDGaT.debug) console.log(response);	
				me.getWidgetView().setSrc();
			},
			failure: function(response) {
				console.error(response);	
			}
		});
	},
	
	onThemeBeforeRender: function(cmb) {
		if(WIDGaT.debug) console.log('onThemeBeforeRender');
		//cmb.setValue(WIDGaT.selectedCompo.get('stylesheet'));
	},
    
	onComposStoreLoad: function(store, records, success, operation, eOpts) {
       if(WIDGaT.debug) console.log("WIDGaT.controller.Compos.onComposStoreLoad()");
	   //if(WIDGaT.debug) console.log("id=2: ", store.getById(2));
	   
		var tblItems = new Array();
		
		Ext.each(store.getGroups(), function(group) {
		
			var mStore = Ext.create('WIDGaT.store.Compos');
			mStore.loadRecords(group.children);
			
			var mDataView = Ext.create('WIDGaT.view.compo.DataView', { });
			mDataView.bindStore(mStore);
			mDataView.on('render', function(view) {
				view.tip = Ext.create('Ext.tip.ToolTip', {
					target: view.el,
					delegate: view.itemSelector,
					trackMouse: true,
					renderTo: Ext.getBody(),
					listeners: {
						beforeshow: function updateTipBody(tip) {
							var tmpRecord = view.getRecord(tip.triggerElement);
							var descHtml = "<b>" + tmpRecord.get('name') + "</b><br />"
												 + tmpRecord.get('description') + "<br />";
							if(tmpRecord.attributes().getCount() > 0) {
								descHtml += "<b>Attributes</b><br />";
								descHtml += '<ul class="tooltip-list">';
								tmpRecord.attributes().each(function(r) {
									descHtml += "<li>" + r.get('name') + "</li>";
								});
								descHtml += '</ul>';
							}
							if(tmpRecord.actions().getCount() > 0) {
								descHtml += "<b>Actions</b><br />";
								descHtml += '<ul class="tooltip-list">';
								tmpRecord.actions().each(function(r) {
									descHtml += "<li>" + r.get('name') + "</li>";
								});
								descHtml += '</ul>';
							}
							if(tmpRecord.themes().getCount() > 0) {
								descHtml += "<b>Themes</b><br />";
								tmpRecord.themes().each(function(r) {
									descHtml += r.get('name') + ", ";
								});
							}
							tip.update(descHtml);
						}
					}
				});
			});

			
			var mPanel = Ext.create('Ext.panel.Panel', {
				title: group.name,
				collapsed: false,
				flex:1,
				layout: 'fit',
				autoScroll: true,
				items: mDataView
			});
					
			tblItems.push(mPanel);
		});
		this.getCompoList().add(tblItems);
		if(WIDGaT.debug) console.log("this.getCompoList()", this.getCompoList());
		Ext.each(this.getCompoList().items.items, function(i) {
				i.expand();
		});
	},
	
	onAfterCompoListRender: function(list) {
		if(WIDGaT.debug) console.log("WIDGaT.controller.Compos.onAfterCompoListRender()");
    	this.getComposStore().load();
	},
    
    onCompoItemClick: function (view, record, item, index) {
        /*if(WIDGaT.debug) console.log('WIDGaT.controller.Compos.onCompoItemClick()');
    	this.getAttributeList().bind(record, this.getAttributesStore());
		this.getGuidanceList().bind(record, this.getGuidancesStore());*/
    	this.getCompoDataView().deselect(index, true);
		
		var vt = this.getCompoList();
		if(WIDGaT.debug) console.log("vt", vt);
		Ext.each(vt.items.items, function(i) {
				if(WIDGaT.debug) console.log("i",i);
				i.down('compoDataView').getSelectionModel().deselectAll();
		});
    },
    
    onCompoItemMouseUp: function (view, record, item, index) {
    	//this.getCompoDataView().deselect(index, true);
    },
    
    onCompoSelectionChange: function(view, records) {
		if(WIDGaT.debug) console.log("WIDGaT.controller.Compos.onCompoSelectionChange()");
        if (records.length) {
        	
            this.getAttributeList().bind(records[0], this.getAttributesStore());
        }
    }
})