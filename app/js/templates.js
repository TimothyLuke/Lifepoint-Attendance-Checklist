angular.module('fluro').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('accordion/accordion.html',
    "<div class=accordion ng-class={expanded:settings.expanded}><div class=accordion-title ng-click=\"settings.expanded = !settings.expanded\"><div class=container-fluid><div class=text-wrap><h3 class=title><i class=\"fa fa-angle-right pull-right\" ng-class=\"{'fa-rotate-90':settings.expanded}\"></i> <span ng-transclude=title></span></h3></div></div></div><div class=accordion-body><div ng-class=\"{'container':wide, 'container-fluid':!wide}\"><div ng-class=\"{'text-wrap':!wide}\" ng-transclude=body></div></div></div></div>"
  );


  $templateCache.put('admin-date-select/admin-date-select.html',
    "<div class=dateselect ng-class={open:settings.open}><div class=btn-group><a class=\"btn btn-default\" ng-class={active:settings.open} ng-click=\"settings.open = !settings.open\"><i class=\"fa fa-calendar\"></i> <span ng-bind-html=\"readable | trusted\"></span></a></div><dpiv class=popup><div class=datetime><div uib-datepicker class=datepicker datepicker-options=datePickerOptions ng-model=settings.dateModel></div></div></dpiv></div>"
  );


  $templateCache.put('extended-field-render/extended-field-render.html',
    "<div class=\"extended-field-render form-group\"><label ng-if=\"field.type != 'group'\">{{field.title}}</label><div field-transclude></div></div>"
  );


  $templateCache.put('extended-field-render/field-types/multiple-value.html',
    "<div ng-switch=field.type><div class=content-select ng-switch-when=reference><div class=\"content-list list-group\"><div class=\"list-group-item clearfix\" ng-repeat=\"item in model[field.key]\"><a ui-sref=viewContent({id:item._id})><div class=pull-left><img ng-if=\"item._type == 'image'\" ng-src=\"{{$root.getThumbnailUrl(item._id)}}\"> <i ng-if=\"item._type != 'image'\" class=\"fa fa-{{item._type}}\"></i> <i ng-if=\"item.definition == 'song'\" class=\"fa fa-music\" style=padding-right:10px></i> <span>{{item.title}}</span></div></a><div class=\"actions pull-right btn-group\"><a class=\"btn btn-tiny btn-xs\" ng-if=\"item.assetType == 'upload'\" target=_blank ng-href={{$root.getDownloadUrl(item._id)}}><i class=\"fa fa-download\"></i></a> <a class=\"btn btn-tiny btn-xs\" ng-if=canEdit(item) ng-click=editInModal(item)><i class=\"fa fa-edit\"></i></a></div></div></div></div><div ng-switch-default><ul><li ng-repeat=\"value in model[field.key]\">{{value}}</li></ul></div></div>"
  );


  $templateCache.put('extended-field-render/field-types/value.html',
    "<div ng-switch=field.type><div class=content-select ng-switch-when=reference><div class=\"content-list list-group\"><div class=\"list-group-item clearfix\" ng-init=\"item = model[field.key]\"><a ui-sref=viewContent({id:item._id})><div class=pull-left><img ng-if=\"item._type == 'image'\" ng-src=\"{{$root.getThumbnailUrl(item._id)}}\"> <i ng-if=\"item._type != 'image'\" class=\"fa fa-{{item._type}}\"></i> <span>{{item.title}}</span></div></a><div class=\"actions pull-right btn-group\"><a class=\"btn btn-tiny btn-xs\" ng-if=\"item.assetType == 'upload'\" target=_blank ng-href={{$root.getDownloadUrl(item._id)}}><i class=\"fa fa-download\"></i></a></div></div></div></div><div ng-switch-when=date>{{model[field.key] | formatDate:'j M Y'}}</div><div ng-switch-when=image><img ng-src=\"{{$root.asset.imageUrl(item._id)}}\"></div><div ng-switch-default><div ng-bind-html=\"model[field.key] | trusted\"></div></div></div>"
  );


  $templateCache.put('fluro-interaction-form/button-select/fluro-button-select.html',
    "<div id={{options.id}} class=\"button-select {{to.definition.directive}}-buttons\" ng-model=model[options.key]><a ng-repeat=\"(key, option) in to.options\" ng-class={active:contains(option.value)} class=\"btn btn-default\" id=\"{{id + '_'+ $index}}\" ng-click=toggle(option.value)><span>{{option.name}}</span><i class=\"fa fa-check\"></i></a></div>"
  );


  $templateCache.put('fluro-interaction-form/custom.html',
    "<div ng-model=model[options.key] compile-html=to.definition.template></div>"
  );


  $templateCache.put('fluro-interaction-form/date-select/fluro-date-select.html',
    "<div ng-controller=FluroDateSelectController><div class=input-group><input class=form-control datepicker-popup={{format}} ng-model=model[options.key] is-open=opened min-date=to.minDate max-date=to.maxDate datepicker-options=dateOptions date-disabled=\"disabled(date, mode)\" ng-required=to.required close-text=\"Close\"> <span class=input-group-btn><button type=button class=\"btn btn-default\" ng-click=open($event)><i class=\"fa fa-calendar\"></i></button></span></div></div>"
  );


  $templateCache.put('fluro-interaction-form/dob-select/fluro-dob-select.html',
    "<div class=fluro-interaction-dob-select><dob-select ng-model=model[options.key] hide-age=to.params.hideAge hide-dates=to.params.hideDates></dob-select></div>"
  );


  $templateCache.put('fluro-interaction-form/embedded/fluro-embedded.html',
    "<div class=fluro-embedded-form><div class=form-multi-group ng-if=\"to.definition.maximum != 1\"><div class=\"panel panel-default\" ng-init=\"fields = copyFields(); dataFields = copyDataFields(); \" ng-repeat=\"entry in model[options.key] track by $index\"><div class=\"panel-heading clearfix\"><a ng-if=canRemove() class=\"btn btn-danger btn-sm pull-right\" ng-click=\"model[options.key].splice($index, 1)\"><span>Remove {{to.label}}</span><i class=\"fa fa-times\"></i></a><h5>{{to.label}} {{$index + 1}}</h5></div><div class=panel-body><formly-form model=entry fields=fields></formly-form><formly-form model=entry.data fields=dataFields></formly-form></div></div><a class=\"btn btn-primary btn-sm\" ng-if=canAdd() ng-click=addAnother()><span>Add <span ng-if=model[options.key].length>another</span> {{to.label}}</span><i class=\"fa fa-plus\"></i></a></div><div ng-if=\"to.definition.maximum == 1 && options.key\"><formly-form model=model[options.key] fields=options.data.fields></formly-form><formly-form model=model[options.key].data fields=options.data.dataFields></formly-form></div></div>"
  );


  $templateCache.put('fluro-interaction-form/field-errors.html',
    "<div class=field-errors ng-if=\"fc.$touched && fc.$invalid\"><div ng-show=fc.$error.required class=\"alert alert-danger\" role=alert><span class=\"fa fa-exclamation\" aria-hidden=true></span> <span class=sr-only>Error:</span> {{to.label}} is required.</div><div ng-show=fc.$error.validInput class=\"alert alert-danger\" role=alert><span class=\"fa fa-exclamation\" aria-hidden=true></span> <span class=sr-only>Error:</span> <span ng-if=!to.errorMessage.length>'{{fc.$viewValue}}' is not a valid value</span> <span ng-if=to.errorMessage.length>{{to.errorMessage}}</span></div><div ng-show=fc.$error.email class=\"alert alert-danger\" role=alert><span class=\"fa fa-exclamation\" aria-hidden=true></span> <span class=sr-only>Error:</span> <span>'{{fc.$viewValue}}' is not a valid email address</span></div></div>"
  );


  $templateCache.put('fluro-interaction-form/fluro-interaction-input.html',
    "<div class=\"fluro-input form-group\" scroll-active ng-class=\"{'fluro-valid':isValid(), 'fluro-dirty':isDirty, 'fluro-invalid':!isValid()}\"><label><i class=\"fa fa-check\" ng-if=isValid()></i><i class=\"fa fa-exclamation\" ng-if=!isValid()></i><span>{{field.title}}</span></label><div class=\"error-message help-block\"><span ng-if=field.errorMessage>{{field.errorMessage}}</span> <span ng-if=!field.errorMessage>Please provide valid input for this field</span></div><span class=help-block ng-if=\"field.description && field.type != 'boolean'\">{{field.description}}</span><div class=fluro-input-wrapper></div></div>"
  );


  $templateCache.put('fluro-interaction-form/fluro-terms.html',
    "<div class=terms-checkbox><div class=checkbox><label><input type=checkbox ng-model=\"model[options.key]\"> {{to.definition.params.storeData}}</label></div></div>"
  );


  $templateCache.put('fluro-interaction-form/fluro-web-form.html',
    "<div class=fluro-interaction-form><div ng-if=!correctPermissions class=form-permission-warning><div class=\"alert alert-warning small\"><i class=\"fa fa-warning\"></i> <span>You do not have permission to post {{model.plural}}</span></div></div><div ng-if=\"promisesResolved && correctPermissions\"><div ng-if=debugMode><div class=\"btn-group btn-group-justified\"><a ng-click=\"vm.state = 'ready'\" class=\"btn btn-default\">State to ready</a> <a ng-click=\"vm.state = 'complete'\" class=\"btn btn-default\">State to complete</a> <a ng-click=reset() class=\"btn btn-default\">Reset</a></div><hr></div><div ng-show=\"vm.state != 'complete'\"><form novalidate ng-submit=vm.onSubmit()><formly-form model=vm.model fields=vm.modelFields form=vm.modelForm options=vm.options><div ng-if=model.data.recaptcha><div recaptcha-render></div></div><div class=\"form-error-summary form-client-error alert alert-warning\" ng-if=\"vm.modelForm.$invalid && !vm.modelForm.$pristine\"><div class=form-error-summary-item ng-repeat=\"field in errorList\" ng-if=field.formControl.$invalid><i class=\"fa fa-exclamation\"></i> <span ng-if=field.templateOptions.definition.errorMessage.length>{{field.templateOptions.definition.errorMessage}}</span> <span ng-if=!field.templateOptions.definition.errorMessage.length>{{field.templateOptions.label}} has not been provided.</span></div></div><div ng-switch=vm.state><div ng-switch-when=sending><a class=\"btn btn-primary\" ng-disabled=true><span>Processing</span> <i class=\"fa fa-spinner fa-spin\"></i></a></div><div ng-switch-when=error><div class=\"form-error-summary form-server-error alert alert-danger\" ng-if=processErrorMessages.length><div class=form-error-summary-item ng-repeat=\"error in processErrorMessages track by $index\"><i class=\"fa fa-exclamation\"></i> <span>Error processing your submission: {{error}}</span></div></div><button type=submit class=\"btn btn-primary\" ng-disabled=!readyToSubmit><span>Try Again</span> <i class=\"fa fa-angle-right\"></i></button></div><div ng-switch-default><button type=submit class=\"btn btn-primary\" ng-disabled=!readyToSubmit><span>{{submitLabel}}</span> <i class=\"fa fa-angle-right\"></i></button></div></div></formly-form></form></div><div ng-show=\"vm.state == 'complete'\"><div compile-html=transcludedContent></div></div></div></div>"
  );


  $templateCache.put('fluro-interaction-form/nested/fluro-nested.html',
    "<div><div class=form-multi-group ng-if=\"to.definition.maximum != 1\"><div class=\"panel panel-default\" ng-init=\"fields = copyFields()\" ng-repeat=\"entry in model[options.key] track by $index\"><div class=\"panel-heading clearfix\"><a ng-if=canRemove() class=\"btn btn-danger btn-sm pull-right\" ng-click=\"model[options.key].splice($index, 1)\"><span>Remove {{to.label}}</span><i class=\"fa fa-times\"></i></a><h5>{{to.label}} {{$index + 1}}</h5></div><div class=panel-body><formly-form model=entry fields=fields></formly-form></div></div><a class=\"btn btn-primary btn-sm\" ng-if=canAdd() ng-click=addAnother()><span>Add <span ng-if=model[options.key].length>another</span> {{to.label}}</span><i class=\"fa fa-plus\"></i></a></div><div ng-if=\"to.definition.maximum == 1 && options.key\"><formly-form model=model[options.key] fields=options.data.fields></formly-form></div></div>"
  );


  $templateCache.put('fluro-interaction-form/order-select/fluro-order-select.html',
    "<div id={{options.id}} class=fluro-order-select><div ng-if=selection.values.length><p class=help-block>Drag to reorder your choices</p></div><div class=list-group as-sortable=dragControlListeners formly-skip-ng-model-attrs-manipulator ng-model=selection.values><div class=\"list-group-item clearfix\" as-sortable-item ng-repeat=\"item in selection.values\"><div class=pull-left as-sortable-item-handle><i class=\"fa fa-arrows order-select-handle\"></i> <span class=\"order-number text-muted\">{{$index+1}}</span> <span>{{item}}</span></div><div class=\"pull-right order-select-remove\" ng-click=deselect(item)><i class=\"fa fa-times\"></i></div></div></div><div ng-if=canAddMore()><p class=help-block>Choose by selecting options below</p><select class=form-control ng-model=selectBox.item ng-change=selectUpdate()><option ng-repeat=\"(key, option) in to.options | orderBy:'value'\" ng-if=!contains(option.value) value={{option.value}}>{{option.value}}</option></select></div></div>"
  );


  $templateCache.put('fluro-interaction-form/payment/payment-method.html',
    "<hr><div class=payment-method-select><div ng-if=!settings.showOptions><h3 class=clearfix>{{selected.method.title}} <em class=\"pull-right small\" ng-click=\"settings.showOptions = !settings.showOptions\">Other payment options <i class=\"fa fa-angle-right\"></i></em></h3></div><div ng-if=settings.showOptions><h3 class=clearfix>Select payment method <em ng-click=\"settings.showOptions = false\" class=\"pull-right small\">Back <i class=\"fa fa-angle-up\"></i></em></h3><div class=\"payment-method-list list-group\"><div class=\"payment-method-list-item list-group-item\" ng-class=\"{active:method == selected.method}\" ng-click=selectMethod(method) ng-repeat=\"method in methodOptions\"><h5 class=title>{{method.title}}</h5></div></div></div><div ng-if=!settings.showOptions><div ng-if=\"selected.method.key == 'card'\"><formly-form model=model fields=options.data.fields></formly-form></div><div ng-if=\"selected.method == method && selected.method.description.length\" ng-repeat=\"method in methodOptions\"><div compile-html=method.description></div></div></div></div><hr>"
  );


  $templateCache.put('fluro-interaction-form/payment/payment-summary.html',
    "<hr><div class=payment-summary><h3>Payment details</h3><div class=form-group><div ng-if=modifications.length class=payment-running-total><div class=\"row payment-base-row\"><div class=col-xs-6><strong>Base Price</strong></div><div class=\"col-xs-3 col-xs-offset-3\">{{paymentDetails.amount / 100 | currency}}</div></div><div class=\"row text-muted\" ng-repeat=\"mod in modifications\"><div class=col-xs-6><em>{{mod.title}}</em></div><div class=\"col-xs-3 text-right\"><em>{{mod.description}}</em></div><div class=col-xs-3><em class=text-muted>{{mod.total / 100 | currency}}</em></div></div><div class=\"row payment-total-row\"><div class=col-xs-6><h4>Total</h4></div><div class=\"col-xs-3 col-xs-offset-3\"><h4>{{calculatedTotal /100 |currency}} <span class=\"text-uppercase text-muted\">{{paymentDetails.currency}}</span></h4></div></div></div><div class=payment-amount ng-if=!modifications.length>{{calculatedTotal /100 |currency}} <span class=text-uppercase>({{paymentDetails.currency}})</span></div></div></div>"
  );


  $templateCache.put('fluro-interaction-form/search-select/fluro-search-select-item.html',
    "<a class=clearfix><i class=\"fa fa-{{match.model._type}}\"></i> <span ng-bind-html=\"match.label | trusted | typeaheadHighlight:query\"></span> <span ng-if=\"match.model._type == 'event' || match.model._type == 'plan'\" class=\"small text-muted\">// {{match.model.startDate | formatDate:'jS F Y - g:ia'}}</span></a>"
  );


  $templateCache.put('fluro-interaction-form/search-select/fluro-search-select-value.html',
    "<a class=clearfix><span ng-bind-html=\"match.label | trusted | typeaheadHighlight:query\"></span></a>"
  );


  $templateCache.put('fluro-interaction-form/search-select/fluro-search-select.html',
    "<div class=fluro-search-select><div ng-if=\"to.definition.type == 'reference'\"><div class=list-group ng-if=\"multiple && selection.values.length\"><div class=list-group-item ng-repeat=\"item in selection.values\"><i class=\"fa fa-times pull-right\" ng-click=deselect(item)></i> {{item.title}}</div></div><div class=list-group ng-if=\"!multiple && selection.value\"><div class=\"list-group-item clearfix\"><i class=\"fa fa-times pull-right\" ng-click=deselect(selection.value)></i> {{selection.value.title}}</div></div><div ng-if=canAddMore()><div class=input-group><input class=form-control formly-skip-ng-model-attrs-manipulator ng-model=proposed.value typeahead-template-url=fluro-interaction-form/search-select/fluro-search-select-item.html typeahead-on-select=select($item) placeholder=Search typeahead=\"item.title for item in retrieveReferenceOptions($viewValue)\" typeahead-loading=\"search.loading\"><div class=input-group-addon ng-if=!search.loading ng-click=\"search.terms = ''\"><i class=fa ng-class=\"{'fa-search':!search.terms.length, 'fa-times':search.terms.length}\"></i></div><div class=input-group-addon ng-if=search.loading><i class=\"fa fa-spin fa-spinner\"></i></div></div></div></div><div ng-if=\"to.definition.type != 'reference'\"><div class=list-group ng-if=\"multiple && selection.values.length\"><div class=list-group-item ng-repeat=\"value in selection.values\"><i class=\"fa fa-times pull-right\" ng-click=deselect(value)></i> {{getValueLabel(value)}}</div></div><div class=list-group ng-if=\"!multiple && selection.value\"><div class=\"list-group-item clearfix\"><i class=\"fa fa-times pull-right\" ng-click=deselect(selection.value)></i> {{getValueLabel(selection.value)}}</div></div><div ng-if=canAddMore()><div class=input-group><input class=form-control formly-skip-ng-model-attrs-manipulator ng-model=proposed.value typeahead-template-url=fluro-interaction-form/search-select/fluro-search-select-value.html typeahead-on-select=select($item.value) placeholder=Search typeahead=\"item.name for item in retrieveValueOptions($viewValue)\" typeahead-loading=\"search.loading\"><div class=input-group-addon ng-if=!search.loading ng-click=\"search.terms = ''\"><i class=fa ng-class=\"{'fa-search':!search.terms.length, 'fa-times':search.terms.length}\"></i></div><div class=input-group-addon ng-if=search.loading><i class=\"fa fa-spin fa-spinner\"></i></div></div></div></div></div>"
  );


  $templateCache.put('fluro-interaction-form/value/value.html',
    "<div class=fluro-interaction-value style=display:none><pre>{{model[options.key] | json}}</pre></div>"
  );


  $templateCache.put('fluro-preloader/fluro-preloader.html',
    "<div class=\"preloader {{preloader.class}}\"><div class=preloader-bg></div><div class=preloader-fg><div class=spinner><svg version=1.1 id=loader-1 xmlns=http://www.w3.org/2000/svg xmlns:xlink=http://www.w3.org/1999/xlink x=0px y=0px width=40px height=40px viewbox=\"0 0 50 50\" style=\"enable-background:new 0 0 50 50\" xml:space=preserve><path fill=#000 d=M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z transform=\"rotate(170 25 25)\"><animatetransform attributetype=xml attributename=transform type=rotate from=\"0 25 25\" to=\"360 25 25\" dur=0.6s repeatcount=indefinite></animatetransform></path></svg></div></div></div>"
  );


  $templateCache.put('routes/checklist/checklist.html',
    "<div class=\"wrapper-sm border-bottom bg-white\"><div class=container><div class=text-wrap><div class=row><div class=col-xs-9><h1 class=title>{{event.title}}</h1><h6 class=text-muted>{{event.startDate | formatDate:'g:ia j M Y'}} <em>({{event.startDate | timeago}})</em></h6></div><div class=\"col-xs-3 text-right\"><a class=\"btn btn-primary btn-sm\" ui-sref=\"new({returnTo:event._id, realm:event.realms[0]._id})\"><i class=\"fa fa-plus\"></i></a></div></div></div></div></div><div class=\"search-row border-bottom\"><div class=text-wrap><div class=input-group style=\"margin-bottom: 0\"><input class=form-control ng-model=search.terms placeholder=\"Search contacts\"><div class=input-group-addon ng-click=\"search.terms = ''\"><i class=fa ng-class=\"{'fa-search':!search.terms.length, 'fa-times':search.terms.length}\"></i></div><div class=input-group-addon ng-class={active:$root.filterPanel} ng-click=\"$root.filterPanel = !$root.filterPanel\"><i class=\"fa fa-ellipsis-v\"></i></div></div></div></div><div class=filters ng-if=$root.filterPanel><div class=\"wrapper-xs bg-white\"><div class=container><div class=text-wrap><h4 class=\"strong title\">Filters</h4><div class=\"row clearfix\"><div class=\"col-xs-12 col-sm-4\"><div class=filter-block><h6>Groups</h6><select ng-model=search.groups class=form-control><option value=\"\">Any</option><optgroup label={{existing.title}} ng-repeat=\"existing in groups track by existing.definition\"><option value={{option._id}} ng-repeat=\"option in existing.groups | orderBy:'title' track by option._id\">{{option.title}}</option></optgroup></select></div></div><div class=\"col-xs-6 col-sm-4\"><div class=filter-block><h6>Realms</h6><select ng-model=search.realms class=form-control><option value=\"\">Any</option><option value={{option._id}} ng-repeat=\"option in realms | orderBy:'title'\">{{option.title}}</option></select></div></div><div class=\"col-xs-6 col-sm-4\"><div class=filter-block><h6>Tags</h6><select ng-model=search.tags class=form-control><option value=\"\">Any</option><option value={{option._id}} ng-repeat=\"option in tags | orderBy:'title'\">{{option.title}}</option></select></div></div><div class=\"col-xs-6 col-sm-4\"><div class=filter-block><h6>Status</h6><select ng-model=search.contactstatus class=form-control><option value=\"\">Any</option><option value={{option}} ng-repeat=\"option in status\">{{option}}</option></select></div></div></div></div></div></div></div><div class=wrapper-sm id=contacts><div class=container><div class=text-wrap><div class=\"wrapper-sm text-center\" ng-if=\"search.terms.length && !(filteredContacts).length\"><p class=\"small text-muted\">Sorry no contacts found for '{{search.terms}}'</p><a class=\"btn btn-default\" ng-click=\"search.terms = ''\"><span>Cancel search</span></a></div><div ng-repeat=\"item in pager.items\"><div class=\"row individual\" ng-class=\"{'active': selected(item)}\"><div class=\"col-xs-10 col-sm-8\"><h5 class=text-capitalize><strong>{{item.lastName}},</strong>&nbsp;{{item.firstName}}</h5></div><div class=\"col-xs-1 col-sm-offset-2 col-sm-1 text-right\" ng-click=toggle(item)><i class=\"fa fa-2x fa-fw\" ng-class=\"{'fa-check-circle':selected(item),  'fa-circle-o':!selected(item) && !isCheckedIn(item), 'fa-check text-muted':isCheckedIn(item)}\"></i></div><div class=\"col-xs-1 col-sm-1 text-right\" ng-click=toggleNotes(item)><i class=\"text-muted fa fa-2x fa-fw fa-pencil-square-o\"></i></div><div class=\"col-xs-12 col-sm-12\" ng-show=item.shownotes><label>Add Note:</label>&nbsp;<input ng-model=item.eventNote style=\"display:table-cell; width:100%\"></div></div></div><div class=text-center ng-if=\"pager.total > pager.itemsPerPage\"><ul uib-pagination class=hidden-xs total-items=pager.total items-per-page=pager.itemsPerPage ng-change=\"$root.scroll.scrollTo(0, 'slow')\" ng-model=pager.current max-size=5 boundary-links=true></ul><ul uib-pagination class=visible-xs-inline-block items-per-page=pager.itemsPerPage total-items=pager.total ng-change=\"$root.scroll.scrollTo(0, 'slow')\" ng-model=pager.current max-size=5 previous-text=Prev></ul></div></div></div></div><div class=footer-spacer ng-if=\"report.items.length > 0\"></div><div class=footer ng-if=\"report.items.length || availableNotes\"><div class=container><div class=text-wrap><a class=\"btn btn-primary btn-block\" ng-click=submitReport()>Submit {{report.items.length}} checkin<span ng-if=\"report.items.length != 1\">s</span></a></div></div></div>"
  );


  $templateCache.put('routes/content/view.html',
    "<div class=\"bg-white border-bottom\"><div class=wrapper-xs><div class=container-fluid><div class=text-wrap><h1><div class=pull-right><i class=\"fa fa-circle\" ng-repeat=\"realm in item.realms\" style=\"margin-left:-30px; color: {{realm.bgColor}}\"></i></div>{{item.title}}</h1><h4 class=text-muted ng-show=definition.title.length>{{definition.title}}</h4><h4 class=text-muted ng-show=!definition.title.length>{{item._type}}</h4><h4 ng-show=\"item.definition == 'song'\"><span class=text-muted>By {{item.data.artist}}</span></h4></div></div></div></div><div ng-switch=item.definition><div ng-switch-when=song><accordion><accordion-title>Song Details</accordion-title><accordion-body><div class=row><div class=\"form-group col-xs-6 col-sm-3\" ng-show=item.data.mm><label>Metronome</label><p>{{item.data.mm}} bpm</p></div><div class=\"form-group col-xs-6 col-sm-3\" ng-show=item.data.key><label>Keys</label><p>{{item.data.key}}</p></div><div class=\"form-group col-xs-12 col-sm-6\" ng-show=item.data.standardStructure><label>Structure</label><p>{{item.data.standardStructure}}</p></div></div><div class=form-group ng-show=item.data.firstLine.length><label>First Line</label><p>{{item.data.firstline}}</p></div></accordion-body></accordion><accordion ng-show=item.data.sheetMusic.length><accordion-title>Sheet Music</accordion-title><accordion-body><div class=list-group><a class=list-group-item ng-repeat=\"file in item.data.sheetMusic\" ng-href=\"{{$root.asset.downloadUrl(file._id, {extension:file.extension})}}\" target=_blank><i class=\"fa fa-download pull-right\"></i> {{file.title}}</a></div></accordion-body></accordion><accordion ng-show=item.data.videos.length><accordion-title>Videos</accordion-title><accordion-body><div ng-repeat=\"video in item.data.videos\"><fluro-video ng-model=video></fluro-video></div></accordion-body></accordion><accordion ng-show=item.data.lyrics.length><accordion-title>Lyrics</accordion-title><accordion-body><div class=list-group-item ng-repeat=\"section in item.data.lyrics\"><h5>{{section.title}}</h5><div compile-html=section.words style=white-space:pre></div></div></accordion-body></accordion></div><div ng-switch-default><div class=wrapper-sm><div class=container-fluid><div class=text-wrap><div view-extended-fields item=item definition=definition></div></div></div></div></div></div>"
  );


  $templateCache.put('routes/events/events.html',
    "<div class=\"bg-white border-bottom\"><div class=wrapper-sm><div class=container-fluid><div class=text-wrap><h1 class=title>Select event</h1><p class=help-block>Select an event below to mark attendance</p></div></div></div></div><div class=\"search-row border-bottom\"><div class=text-wrap><div class=input-group style=\"margin-bottom: 0\"><input ng-model=search.terms class=form-control placeholder=\"Search {{::events.length}} events\"><div class=input-group-addon ng-click=\"search.terms = ''\"><i class=fa ng-class=\"{'fa-search':!search.terms.length, 'fa-times':search.terms.length}\"></i></div><div class=input-group-addon ng-class={active:search.showFilters} ng-click=\"search.showFilters = !search.showFilters\"><i class=\"fa fa-ellipsis-v\"></i></div></div></div></div><div class=\"wrapper-sm filter-bg border-bottom\" ng-if=search.showFilters><div class=container><div class=text-wrap><div class=\"row row-inline\"><div class=\"form-group col-xs-6\"><label>Tags <span class=text-muted>{{::tags.length}}</span></label><select ng-model=search.filters.tags class=form-control><option value=\"\">Any</option><option value={{::tag._id}} ng-repeat=\"tag in tags\">{{::tag.title}}</option></select></div><div class=\"form-group col-xs-6\"><label>Realms <span class=text-muted>{{::realms.length}}</span></label><select ng-model=search.filters.realms class=form-control><option value=\"\">Any</option><option value={{::realm._id}} ng-repeat=\"realm in realms\">{{::realm.title}}</option></select></div></div></div></div></div><div class=wrapper-sm><div class=container-fluid><div class=text-wrap><div class=search-help ng-show=\"filteredItems.length < 1\">{{filteredItems.length}} match<span ng-if=\"filteredItems.length != 1\">es</span> <span ng-show=search.terms.length>'{{search.terms}}'</span></div><div infinite-pager items=dates per-page=10><div ng-repeat=\"page in pages\"><div class=\"panel panel-event-day\" ng-repeat=\"day in page\"><div class=panel-heading><i class=\"fa fa-calendar fa-fw\"></i> {{::day.date | formatDate:'l j M Y'}}</div><div><div class=\"row row-flex panel-event-day-row\" ng-repeat=\"timeslot in day.times | filter:search.terms track by timeslot.time\"><div class=\"col-xs-2 bg-light\"><div class=assignment-time>{{::timeslot.time}}</div></div><div class=\"col-xs-10 border-left\"><div><a ui-sref=checklist({id:event._id}) ng-repeat=\"event in timeslot.events | filter:search.terms track by event._id\" class=timeslot-row><div ng-repeat=\"realm in event.realms\" class=realm-bar style=background-color:{{::realm.bgColor}}></div><h6 class=title><strong>{{::event.title}}</strong></h6><div class=\"small text-muted\">{{::event.firstLine}}</div></a></div></div></div></div></div></div></div></div></div></div>"
  );


  $templateCache.put('routes/new/new.html',
    "<div class=\"wrapper new\"><div ng-switch=settings.state><div ng-switch-when=processing><div class=text-center><i class=\"fa fa-spinner fa-spin fa-3x\"></i></div><div class=container><div class=text-center><div class=wrapper><h2>Processing</h2><p class=\"text-muted help-block\"><em>Please wait</em></p></div></div></div></div><div ng-switch-when=failed><div class=text-center><i class=\"fa fa-frown-o fa-3x\"></i></div><div class=container><div class=text-center><div class=wrapper><h2>There was a problem saving new contact</h2><p class=\"text-muted help-block\"><em>Click below to return to the previous screen</em></p></div><a class=\"btn btn-primary btn-sm\" ng-click=\"settings.state = 'ready'\">Go back</a></div></div></div><div ng-switch-when=success><div class=text-center><i class=\"fa fa-smile-o fa-3x\"></i></div><div class=container><div class=text-center><div class=wrapper><h2>Contact created successfully</h2><p class=\"text-muted help-block\"><em>You can now check in {{settings.result.firstName}}</em></p></div><a class=\"btn btn-primary btn-sm\" ng-click=$root.breadcrumb.back()>Return to event</a> <a class=\"btn btn-default btn-sm\" ng-click=\"settings.state = 'ready'\">Add another contact</a></div></div></div><div ng-switch-default class=container><div class=text-wrap><h3>Add a new contact</h3><br><form ng-submit=submitForm()><div class=row><div class=\"form-group col-sm-4\"><label>First Name</label><input placeholder=\"First Name\" ng-model=contact.firstName class=\"form-control\"></div><div class=\"form-group col-sm-5\"><label>Last Name</label><input placeholder=\"Last Name\" ng-model=contact.lastName class=\"form-control\"></div><div class=\"form-group col-sm-3\"><label>Gender</label><select ng-model=contact.gender class=form-control><option value=male>Male</option><option value=female>Female</option></select></div></div><div class=row><div class=\"form-group col-sm-6\"><label>Phone Number</label><input placeholder=\"Phone Number\" ng-model=contact.phoneNumbers[0] class=\"form-control\"></div><div class=\"form-group col-sm-6\"><label>Email Address</label><input placeholder=\"Email Address\" type=email ng-model=contact.emails[0] class=\"form-control\"></div></div><button class=\"btn btn-primary\"><span>Submit</span> <i class=\"fa fa-angle-right\"></i></button> <a class=\"btn btn-default\" ng-click=$root.breadcrumb.back()><span>Cancel</span></a></form></div></div></div></div>"
  );

}]);
