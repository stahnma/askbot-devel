//var $, scriptUrl, askbotSkin
var mediaUrl = function(resource){
    return askbot['settings']['static_url'] + askbotSkin + '/' + resource;
};

var cleanUrl = function(url){
    var re = new RegExp('//', 'g');
    return url.replace(re, '/');
};

var copyAltToTitle = function(sel){
    sel.attr('title', sel.attr('alt'));
};

var animateHashes = function(){
    var id_value = window.location.hash;
    if (id_value != ""){
        var previous_color = $(id_value).css('background-color');
        $(id_value).css('backgroundColor', '#FFF8C6');
        $(id_value)
            .animate({backgroundColor: '#ff7f2a'}, 500)
            .animate({backgroundColor: '#FFF8C6'}, 500, function(){
                $(id_value).css('backgroundColor', previous_color);
            });
    }
};

var getUniqueWords = function(value){
    var words = $.trim(value).split(/\s+/);
    var uniques = new Object();
    var out = new Array();
    $.each(words, function(idx, item){
        if (!(item in uniques)){
            uniques[item] = 1;
            out.push(item);
        };
    });
    return out;
};

var showMessage = function(element, msg, where) {
    var div = $('<div class="vote-notification"><h3>' + msg + '</h3>(' +
    gettext('click to close') + ')</div>');

    div.click(function(event) {
        $(".vote-notification").fadeOut("fast", function() { $(this).remove(); });
    });

    var where = where || 'parent';

    if (where == 'parent'){
        element.parent().append(div);
    }
    else {
        element.after(div);
    }

    div.fadeIn("fast");
};

//outer html hack - https://github.com/brandonaaron/jquery-outerhtml/
(function($){
    var div;
    $.fn.outerHTML = function() {
        var elem = this[0],
        tmp;
        return !elem ? null
        : typeof ( tmp = elem.outerHTML ) === 'string' ? tmp
        : ( div = div || $('<div/>') ).html( this.eq(0).clone() ).html();
    };
})(jQuery);

var makeKeyHandler = function(key, callback){
    return function(e){
        if ((e.which && e.which == key) || (e.keyCode && e.keyCode == key)){
            if(!e.shiftKey){
                callback();
                return false;
            }
        }
    };
};


var setupButtonEventHandlers = function(button, callback){
    button.keydown(makeKeyHandler(13, callback));
    button.click(callback);
};


var putCursorAtEnd = function(element){
    var el = element.get()[0];
    if (el.setSelectionRange){
        var len = element.val().length * 2;
        el.setSelectionRange(len, len);
    }
    else{
        element.val(element.val());
    }
    element.scrollTop = 999999;
};

var setCheckBoxesIn = function(selector, value){
    return $(selector + '> input[type=checkbox]').attr('checked', value);
};

var notify = function() {
    var visible = false;
    return {
        show: function(html) {
            if (html) {
                $("body").css("margin-top", "2.2em");
                $(".notify span").html(html);        
            }          
            $(".notify").fadeIn("slow");
            visible = true;
        },       
        close: function(doPostback) {
            if (doPostback) {
               $.post(
                   askbot['urls']['mark_read_message'],
                   { formdata: "required" }
               );
            }
            $(".notify").fadeOut("fast");
            $("body").css("margin-top", "0");
            visible = false;
        },     
        isVisible: function() { return visible; }     
    };
} ();

/* **************************************************** */
// Search query-string manipulation utils
/* **************************************************** */

var QSutils = QSutils || {};  // TODO: unit-test me

QSutils.TAG_SEP = ','; // should match const.TAG_SEP; TODO: maybe prepopulate this in javascript.html ?

QSutils.get_query_string_selector_value = function (query_string, selector) {
    var params = query_string.split('/');
    for(var i=0; i<params.length; i++) {
        var param_split = params[i].split(':');
        if(param_split[0] === selector) {
            return param_split[1];
        }
    }
    return undefined;
};

QSutils.patch_query_string = function (query_string, patch, remove) {
    var params = query_string.split('/');
    var patch_split = patch.split(':');

    var new_query_string = '';
    var mapping = {};

    if(!remove) {
        mapping[patch_split[0]] = patch_split[1]; // prepopulate the patched selector if it's not meant to be removed
    }

    for (var i = 0; i < params.length; i++) {
        var param_split = params[i].split(':');
        if(param_split[0] !== patch_split[0] && param_split[1]) {
            mapping[param_split[0]] = param_split[1];
        }
    }

    var add_selector = function(name) {
        if(name in mapping) {
            new_query_string += name + ':' + mapping[name] + '/';
        }
    };

    /* The order of selectors should match the Django URL */
    add_selector('scope');
    add_selector('sort');
    add_selector('query');
    add_selector('tags');
    add_selector('author');
    add_selector('page');

    return new_query_string;
};

QSutils.remove_search_tag = function(query_string, tag){
    var tag_string = this.get_query_string_selector_value(query_string, 'tags');
    if(!tag_string) {
        return query_string;
    }

    var tags = tag_string.split(this.TAG_SEP);

    var pos = $.inArray(encodeURIComponent(tag), tags);
    if(pos > -1) {
        tags.splice(pos, 1); /* array.splice() works in-place */
    }

    if(tags.length === 0) {
        return this.patch_query_string(query_string, 'tags:', true);
    } else {
        return this.patch_query_string(query_string, 'tags:' + tags.join(this.TAG_SEP));
    }
};

QSutils.add_search_tag = function(query_string, tag){
    var tag_string = this.get_query_string_selector_value(query_string, 'tags');
    tag = encodeURIComponent(tag);
    if(!tag_string) {
        tag_string = tag;
    } else {
        tag_string = [tag_string, tag].join(this.TAG_SEP);
    }

    return this.patch_query_string(query_string, 'tags:' + tag_string);
};

/* **************************************************** */

/* some google closure-like code for the ui elements */
var inherits = function(childCtor, parentCtor) {
  /** @constructor taken from google closure */
    function tempCtor() {};
    tempCtor.prototype = parentCtor.prototype;
    childCtor.superClass_ = parentCtor.prototype;
    childCtor.prototype = new tempCtor();
    childCtor.prototype.constructor = childCtor;
};

/* wrapper around jQuery object */
var WrappedElement = function(){
    this._element = null;
    this._in_document = false;
};
WrappedElement.prototype.setElement = function(element){
    this._element = element;
};
WrappedElement.prototype.createDom = function(){
    this._element = $('<div></div>');
};
WrappedElement.prototype.decorate = function(element){
    this._element = element;
};
WrappedElement.prototype.getElement = function(){
    if (this._element === null){
        this.createDom();
    }
    return this._element;
};
WrappedElement.prototype.inDocument = function(){
    return this._in_document;
};
WrappedElement.prototype.enterDocument = function(){
    return this._in_document = true;
};
WrappedElement.prototype.hasElement = function(){
    return (this._element !== null);
};
WrappedElement.prototype.makeElement = function(html_tag){
    //makes jQuery element with tags
    return $('<' + html_tag + '></' + html_tag + '>');
};
WrappedElement.prototype.dispose = function(){
    this._element.remove();
    this._in_document = false;
};

/**
 * Can be used for an input box or textarea.
 * The original value will be treated as an instruction.
 * When user focuses on the field, the tip will be gone,
 * when the user escapes without typing anything besides 
 * perhaps empty text, the instruction is restored.
 * When instruction is shown, class "blank" is present
 * in the input/textare element.
 */
var TippedInput = function(){
    WrappedElement.call(this);
    this._instruction = null;
};
inherits(TippedInput, WrappedElement);

TippedInput.prototype.reset = function(){
    $(this._element).val(this._instruction);
    $(this._element).addClass('blank');
};

TippedInput.prototype.isBlank = function(){
    return this.getVal() === this._instruction;
};

TippedInput.prototype.getVal = function(){
    return this._element.val();
};

TippedInput.prototype.setVal = function(value){
    if (value) {
        this._element.val(value);
        if (this.isBlank()){
            this._element.addClass('blank');
        } else {
            this._element.removeClass('blank');
        }
    }
};

TippedInput.prototype.decorate = function(element){
    this._element = element;
    var instruction_text = this.getVal();
    this._instruction = instruction_text;
    var me = this;
    $(element).focus(function(){
        if (me.isBlank()){
            $(element)
                .val('')
                .removeClass('blank');
        }
    });
    $(element).blur(function(){
        var val = $(element).val();
        if ($.trim(val) === ''){
            $(element)
                .val(instruction_text)
                .addClass('blank');
        }
    });
    makeKeyHandler(13, function(){
        $(element).blur();
    });
};

/**
 * will setup a bootstrap.js alert
 * programmatically
 */
var AlertBox = function(){
    WrappedElement.call(this);
    this._text = null;
};
inherits(AlertBox, WrappedElement);

AlertBox.prototype.setClass = function(classes){
    this._classes = classes;
    if (this._element){
        this._element.addClass(classes);
    }
};

AlertBox.prototype.setError = function(state){
    this._is_error = state;
    if (this._element) {
        if (state === true) {
            this._element.addClass('alert-error');
        } else {
            this._element.removeClass('alert-error');
        }
    }
};

AlertBox.prototype.setText = function(text){
    this._text = text;
    if (this._content){
        this._content.html(text);
    }
};

AlertBox.prototype.getContent = function(){
    if (this._content){
        return this._content;
    } else {
        this._content = this.makeElement('div');
        return this._content;
    }
};

AlertBox.prototype.setContent = function(content){
    var container = this.getContent();
    container.empty()
    container.append(content);
};

AlertBox.prototype.addContent = function(content){
    var container = this.getContent();
    container.append(content);
};

AlertBox.prototype.createDom = function(){
    this._element = this.makeElement('div');
    this._element.addClass('alert fade in');

    if (this._is_error) {
        this.setError(this._is_error);
    }

    if (this._classes){
        this._element.addClass(this._classes);
    }

    this._cancel_button = this.makeElement('button');
    this._cancel_button
        .addClass('close')
        .attr('data-dismiss', 'alert')
        .html('&times;');
    this._element.append(this._cancel_button);

    this._element.append(this.getContent());
    if (this._text){
        this.setText(this._text);
    }

    this._element.alert();//bootstrap.js alert
};

var SimpleControl = function(){
    WrappedElement.call(this);
    this._handler = null;
    this._title = null;
};
inherits(SimpleControl, WrappedElement);

SimpleControl.prototype.setHandler = function(handler){
    this._handler = handler;
    if (this.hasElement()){
        this.setHandlerInternal();
    }
};

SimpleControl.prototype.getHandler = function(){
    return this._handler;
};

SimpleControl.prototype.setHandlerInternal = function(){
    //default internal setHandler behavior
    setupButtonEventHandlers(this._element, this._handler);
};

SimpleControl.prototype.setTitle = function(title){
    this._title = title;
};

var EditLink = function(){
    SimpleControl.call(this)
};
inherits(EditLink, SimpleControl);

EditLink.prototype.createDom = function(){
    var element = $('<a></a>');
    element.addClass('edit');
    this.decorate(element);
};

EditLink.prototype.decorate = function(element){
    this._element = element;
    this._element.attr('title', gettext('click to edit this comment'));
    this._element.html(gettext('edit'));
    this.setHandlerInternal();
};

var DeleteIcon = function(title){
    SimpleControl.call(this);
    this._title = title;
    this._content = null;
};
inherits(DeleteIcon, SimpleControl);

DeleteIcon.prototype.decorate = function(element){
    this._element = element;
    this._element.attr('class', 'delete-icon');
    this._element.attr('title', this._title);
    if (this._handler !== null){
        this.setHandlerInternal();
    }
};

DeleteIcon.prototype.setHandlerInternal = function(){
    setupButtonEventHandlers(this._element, this._handler);
};

DeleteIcon.prototype.createDom = function(){
    this._element = this.makeElement('span');
    this.decorate(this._element);
    if (this._content !== null){
        this.setContent(this._content);
    }
};

DeleteIcon.prototype.setContent = function(content){
    if (this._element === null){
        this._content = content;
    } else {
        this._content = content;
        this._element.html(content);
    }
}

/**
 * attaches a modal menu with a text editor
 * to a link. The modal menu is from bootstrap.js
 */
var TextPropertyEditor = function(){
    WrappedElement.call(this);
    this._editor = null;
};
inherits(TextPropertyEditor, WrappedElement);

TextPropertyEditor.prototype.getWidgetData = function(){
    var data = this._element.data();
    return {
        object_id: data['objectId'],
        model_name: data['modelName'],
        property_name: data['propertyName'],
        url: data['url'],
        help_text: data['helpText'],
        editor_heading: data['editorHeading']
    };
};

TextPropertyEditor.prototype.makeEditor = function(){
    if (this._editor) {
        return this._editor;
    }
    var editor = this.makeElement('div')
        .addClass('modal');
    this._editor = editor;

    var header = this.makeElement('div')
        .addClass('modal-header');
    editor.append(header);

    var close_link = this.makeElement('div')
        .addClass('close')
        .attr('data-dismiss', 'modal')
        .html('x');
    header.append(close_link);

    var title = this.makeElement('h3')
        .html(this.getWidgetData()['editor_heading']);
    header.append(title);

    var body = this.makeElement('div')
        .addClass('modal-body');
    editor.append(body);

    var textarea = this.makeElement('textarea')
        .addClass('tipped-input blank')
        .val(this.getWidgetData()['help_text']);
    body.append(textarea);

    var tipped_input = new TippedInput();
    tipped_input.decorate(textarea);
    this._text_input = tipped_input;

    var footer = this.makeElement('div')
        .addClass('modal-footer');
    editor.append(footer);

    var save_btn = this.makeElement('button')
        .addClass('btn btn-primary')
        .html(gettext('Save'));
    footer.append(save_btn);

    var cancel_btn = this.makeElement('button')
        .addClass('btn cancel')
        .html(gettext('Cancel'));
    footer.append(cancel_btn);

    var me = this;
    setupButtonEventHandlers(save_btn, function(){
        me.saveData();
    });
    setupButtonEventHandlers(cancel_btn, function(){
        editor.modal('hide');
    });
    editor.modal('hide');

    $(document).append(editor);
    return editor;
};

TextPropertyEditor.prototype.openEditor = function(){
    this._editor.modal('show');
};

TextPropertyEditor.prototype.clearMessages = function(){
    this._editor.find('.alert').remove();
};

TextPropertyEditor.prototype.getAlert = function(){
    var box = new AlertBox();
    var modal_body = this._editor.find('.modal-body');
    modal_body.prepend(box.getElement());
    return box;
};

TextPropertyEditor.prototype.showAlert = function(text){
    this.clearMessages();
    var box = this.getAlert();
    box.setText(text);
    return box;
};

TextPropertyEditor.prototype.showError = function(text){
    var box = this.showAlert(text);
    box.setError(true);
    return box;
};

TextPropertyEditor.prototype.setText = function(text){
    this._text_input.setVal(text);
};

TextPropertyEditor.prototype.getText = function(){
    return this._text_input.getVal();
};

TextPropertyEditor.prototype.hideDialog = function(){
    this._editor.modal('hide');
};

TextPropertyEditor.prototype.startOpeningEditor = function(){
    var me = this;
    $.ajax({
        type: 'GET',
        dataType: 'json',
        cache: false,
        url: me.getWidgetData()['url'],
        data: me.getWidgetData(),
        success: function(data){
            if (data['success']) {
                me.makeEditor();
                me.setText($.trim(data['text']));
                me.openEditor();
            } else {
                showMessage(me.getElement(), data['message']);
            }
        }
    });
};

TextPropertyEditor.prototype.saveData = function(){
    var data = this.getWidgetData();
    data['text'] = this.getText();
    var me = this;
    $.ajax({
        type: 'POST',
        dataType: 'json',
        cache: false,
        url: me.getWidgetData()['url'],
        data: data,
        success: function(data) {
            if (data['success']) {
                me.showAlert(gettext('saved'));
                setTimeout(function(){
                    me.clearMessages();
                    me.hideDialog();
                }, 1000);
            } else {
                me.showError(data['message']);
            }
        }
    });
};

TextPropertyEditor.prototype.decorate = function(element){
    this._element = element;
    var me = this;
    setupButtonEventHandlers(element, function(){ me.startOpeningEditor() });
};

/**
 * A button on which user can click
 * and become added to some group (followers, group members, etc.)
 * or toggle some state on/off
 * The button has four states on-prompt, off-prompt, on-state and off-state
 * on-prompt is activated on mouseover, when user is not part of group
 * off-prompt - on mouseover, when user is part of group
 * on-state - when user is part of group and mouse is not over the button
 * off-state - same as above, but when user is not part of the group
 */
var TwoStateToggle = function(){
    SimpleControl.call(this);
    this._state = null;
    this._state_messages = {};
    this._states = [
        'on-state',
        'off-state',
        'on-prompt',
        'off-prompt'
    ];
    this._handler = this.getDefaultHandler();
    this._post_data = {};
    this.toggleUrl = '';//public property
};
inherits(TwoStateToggle, SimpleControl);

TwoStateToggle.prototype.setPostData = function(data){
    this._post_data = data;
};

TwoStateToggle.prototype.getPostData = function(){
    return this._post_data;
};

TwoStateToggle.prototype.resetStyles = function(){
    var element = this._element;
    var states = this._states;
    $.each(states, function(idx, state){
        element.removeClass(state);
    });
    this._element.html('');
};

TwoStateToggle.prototype.isOn = function(){
    return this._element.hasClass('on');
};

TwoStateToggle.prototype.getDefaultHandler = function(){
    var me = this;
    return function(){
        var data = me.getPostData();
        data['disable'] = me.isOn();
        $.ajax({
            type: 'POST',
            dataType: 'json',
            cache: false,
            url: me.toggleUrl,
            data: data,
            success: function(data) {
                if (data['success']) {
                    if ( data['is_enabled'] ) {
                        me.setState('on-state');
                    } else {
                        me.setState('off-state');
                    }
                } else {
                    showMessage(me.getElement(), data['message']);
                }
            }
        });
    };
};

TwoStateToggle.prototype.isCheckBox = function(){
    var element = this._element;
    return element.attr('type') === 'checkbox';
};

TwoStateToggle.prototype.setState = function(state){
    var element = this._element;
    this._state = state;
    if (element) {
        this.resetStyles();
        element.addClass(state);
        if (state === 'on-state') {
            element.addClass('on');
        } else if (state === 'off-state') {
            element.removeClass('on');
        }
        if ( this.isCheckBox() ) {
            if (state === 'on-state') {
                element.attr('checked', true);
            } else if (state === 'off-state') {
                element.attr('checked', false);
            }
        } else {
            this._element.html(this._state_messages[state]);
        }
    }
};

TwoStateToggle.prototype.decorate = function(element){
    this._element = element;
    //read messages for all states
    var messages = {};
    messages['on-state'] =
        element.attr('data-on-state-text') || gettext('enabled');
    messages['off-state'] = 
        element.attr('data-off-state-text') || gettext('disabled');
    messages['on-prompt'] =
        element.attr('data-on-prompt-text') || messages['on-state'];
    messages['off-prompt'] = 
        element.attr('data-off-prompt-text') || messages['off-state'];
    this._state_messages = messages;

    this.toggleUrl = element.attr('data-toggle-url');

    //detect state and save it
    if (
        element.attr('nodeName') === 'INPUT' && element.attr('type', 'checkbox')
    ) {
        this._state = element.attr('checked') ? 'state-on' : 'state-off';
    } else {
        var text = $.trim(element.html());
        for (var i = 0; i < this._states.length; i++){
            var state = this._states[i];
            if (text === messages[state]){
                this._state = state;
                break;
            }
        }
    }

    //set mouseover handler
    var me = this;
    element.mouseover(function(){
        var is_on = me.isOn();
        if (is_on){
            me.setState('off-prompt');
        } else {
            me.setState('on-prompt');
        }
        element.css('background-color', 'red');
        return false;
    });
    element.mouseout(function(){
        var is_on = me.isOn();
        if (is_on){
            me.setState('on-state');
        } else {
            me.setState('off-state');
        }
        element.css('background-color', 'white');
        return false;
    });

    setupButtonEventHandlers(element, this.getHandler());
};

/**
 * A list of items from where one can be selected
 */
var SelectBox = function(){
    WrappedElement.call(this);
    this._items = [];
};
inherits(SelectBox, WrappedElement);

SelectBox.prototype.removeItem = function(id){
    var item = this.getItem(id);
    item.fadeOut();
    item.remove();
};

SelectBox.prototype.getItem = function(id){
    return $(this._element.find('li[data-item-id="' + id + '"]'));
};

SelectBox.prototype.addItem = function(id, title, details){
    /*this._items.push({
        id: id,
        title: title,
        details: details
    });*/
    if (this._element){
        var li = this.getItem(id);
        var new_li = false;
        if (li.length !== 1){
            li = this.makeElement('li');
            new_li = true;
        }
        li.attr('data-item-id', id)
            .attr('data-original-title', details)
            .html(title);
        if (new_li){
            this._element.append(li);
        }
        this.selectItem($(li));
        var me = this;
        setupButtonEventHandlers(
            $(li),
            function(){
                me.selectItem($(li));
            }
        );
    }
};

SelectBox.prototype.getSelectedItemData = function(){
    var item = $(this._element.find('li.selected')[0]);
    return {
        id: item.attr('data-item-id'),
        title: item.html(),
        details: item.attr('data-original-title')
    };
};

SelectBox.prototype.selectItem = function(item){
    this._element.find('li').removeClass('selected');
    item.addClass('selected');
};

SelectBox.prototype.decorate = function(element){
    this._element = element;
    var me = this;
    this._element.find('li').each(function(itx, item){
        setupButtonEventHandlers(
            $(item),
            function(){
                me.selectItem($(item));
            }
        );
    });
};

var Tag = function(){
    SimpleControl.call(this);
    this._deletable = false;
    this._delete_handler = null;
    this._delete_icon_title = null;
    this._tag_title = null;
    this._name = null;
    this._url_params = null;
    this._inner_html_tag = 'a';
    this._html_tag = 'li';
}
inherits(Tag, SimpleControl);

Tag.prototype.setName = function(name){
    this._name = name;
};

Tag.prototype.getName = function(){
    return this._name;
};

Tag.prototype.setHtmlTag = function(html_tag){
    this._html_tag = html_tag;
};

Tag.prototype.setDeletable = function(is_deletable){
    this._deletable = is_deletable;
};

Tag.prototype.setLinkable = function(is_linkable){
    if (is_linkable === true){
        this._inner_html_tag = 'a';
    } else {
        this._inner_html_tag = 'span';
    }
};

Tag.prototype.isLinkable = function(){
    return (this._inner_html_tag === 'a');
};

Tag.prototype.isDeletable = function(){
    return this._deletable;
};

Tag.prototype.isWildcard = function(){
    return (this.getName().substr(-1) === '*');
};

Tag.prototype.setUrlParams = function(url_params){
    this._url_params = url_params;
};

Tag.prototype.setHandlerInternal = function(){
    setupButtonEventHandlers(this._element.find('.tag'), this._handler);
};

/* delete handler will be specific to the task */
Tag.prototype.setDeleteHandler = function(delete_handler){
    this._delete_handler = delete_handler;
    if (this.hasElement() && this.isDeletable()){
        this._delete_icon.setHandler(delete_handler);
    }
};

Tag.prototype.getDeleteHandler = function(){
    return this._delete_handler;
};

Tag.prototype.setDeleteIconTitle = function(title){
    this._delete_icon_title = title;
};

Tag.prototype.decorate = function(element){
    this._element = element;
    var del = element.find('.delete-icon');
    if (del.length === 1){
        this.setDeletable(true);
        this._delete_icon = new DeleteIcon();
        if (this._delete_icon_title != null){
            this._delete_icon.setTitle(this._delete_icon_title);
        }
        //do not set the delete handler here
        this._delete_icon.decorate(del);
    }
    this._inner_element = this._element.find('.tag');
    this._name = this.decodeTagName($.trim(this._inner_element.html()));
    if (this._title !== null){
        this._inner_element.attr('title', this._title);
    }
    if (this._handler !== null){
        this.setHandlerInternal();
    }
};

Tag.prototype.getDisplayTagName = function(){
    //replaces the trailing * symbol with the unicode asterisk
    return this._name.replace(/\*$/, '&#10045;');
};

Tag.prototype.decodeTagName = function(encoded_name){
    return encoded_name.replace('\u273d', '*');
};

Tag.prototype.createDom = function(){
    this._element = this.makeElement(this._html_tag);
    //render the outer element
    if (this._deletable){
        this._element.addClass('deletable-tag');
    }
    this._element.addClass('tag-left');

    //render the inner element
    this._inner_element = this.makeElement(this._inner_html_tag);
    if (this.isLinkable()){
        var url = askbot['urls']['questions'];
        var flag = false
        var author = ''
        if (this._url_params){
            url += QSutils.add_search_tag(this._url_params, this.getName());
        }
        this._inner_element.attr('href', url);
    }
    this._inner_element.addClass('tag tag-right');
    this._inner_element.attr('rel', 'tag');
    if (this._title === null){
        this.setTitle(
            interpolate(gettext("see questions tagged '%s'"), [this.getName()])
        );
    }
    this._inner_element.attr('title', this._title);
    this._inner_element.html(this.getDisplayTagName());

    this._element.append(this._inner_element);

    if (!this.isLinkable() && this._handler !== null){
        this.setHandlerInternal();
    }

    if (this._deletable){
        this._delete_icon = new DeleteIcon();
        this._delete_icon.setHandler(this.getDeleteHandler());
        if (this._delete_icon_title !== null){
            this._delete_icon.setTitle(this._delete_icon_title);
        }
        var del_icon_elem = this._delete_icon.getElement();
        del_icon_elem.text('x'); // HACK by Tomasz
        this._element.append(del_icon_elem);
    }
};

//Search Engine Keyword Highlight with Javascript
//http://scott.yang.id.au/code/se-hilite/
Hilite={elementid:"content",exact:true,max_nodes:1000,onload:true,style_name:"hilite",style_name_suffix:true,debug_referrer:""};Hilite.search_engines=[["local","q"],["cnprog\\.","q"],["google\\.","q"],["search\\.yahoo\\.","p"],["search\\.msn\\.","q"],["search\\.live\\.","query"],["search\\.aol\\.","userQuery"],["ask\\.com","q"],["altavista\\.","q"],["feedster\\.","q"],["search\\.lycos\\.","q"],["alltheweb\\.","q"],["technorati\\.com/search/([^\\?/]+)",1],["dogpile\\.com/info\\.dogpl/search/web/([^\\?/]+)",1,true]];Hilite.decodeReferrer=function(d){var g=null;var e=new RegExp("");for(var c=0;c<Hilite.search_engines.length;c++){var f=Hilite.search_engines[c];e.compile("^http://(www\\.)?"+f[0],"i");var b=d.match(e);if(b){var a;if(isNaN(f[1])){a=Hilite.decodeReferrerQS(d,f[1])}else{a=b[f[1]+1]}if(a){a=decodeURIComponent(a);if(f.length>2&&f[2]){a=decodeURIComponent(a)}a=a.replace(/\'|"/g,"");a=a.split(/[\s,\+\.]+/);return a}break}}return null};Hilite.decodeReferrerQS=function(f,d){var b=f.indexOf("?");var c;if(b>=0){var a=new String(f.substring(b+1));b=0;c=0;while((b>=0)&&((c=a.indexOf("=",b))>=0)){var e,g;e=a.substring(b,c);b=a.indexOf("&",c)+1;if(e==d){if(b<=0){return a.substring(c+1)}else{return a.substring(c+1,b-1)}}else{if(b<=0){return null}}}}return null};Hilite.hiliteElement=function(f,e){if(!e||f.childNodes.length==0){return}var c=new Array();for(var b=0;b<e.length;b++){e[b]=e[b].toLowerCase();if(Hilite.exact){c.push("\\b"+e[b]+"\\b")}else{c.push(e[b])}}c=new RegExp(c.join("|"),"i");var a={};for(var b=0;b<e.length;b++){if(Hilite.style_name_suffix){a[e[b]]=Hilite.style_name+(b+1)}else{a[e[b]]=Hilite.style_name}}var d=function(m){var j=c.exec(m.data);if(j){var n=j[0];var i="";var h=m.splitText(j.index);var g=h.splitText(n.length);var l=m.ownerDocument.createElement("SPAN");m.parentNode.replaceChild(l,h);l.className=a[n.toLowerCase()];l.appendChild(h);return l}else{return m}};Hilite.walkElements(f.childNodes[0],1,d)};Hilite.hilite=function(){var a=Hilite.debug_referrer?Hilite.debug_referrer:document.referrer;var b=null;a=Hilite.decodeReferrer(a);if(a&&((Hilite.elementid&&(b=document.getElementById(Hilite.elementid)))||(b=document.body))){Hilite.hiliteElement(b,a)}};Hilite.walkElements=function(d,f,e){var a=/^(script|style|textarea)/i;var c=0;while(d&&f>0){c++;if(c>=Hilite.max_nodes){var b=function(){Hilite.walkElements(d,f,e)};setTimeout(b,50);return}if(d.nodeType==1){if(!a.test(d.tagName)&&d.childNodes.length>0){d=d.childNodes[0];f++;continue}}else{if(d.nodeType==3){d=e(d)}}if(d.nextSibling){d=d.nextSibling}else{while(f>0){d=d.parentNode;f--;if(d.nextSibling){d=d.nextSibling;break}}}}};if(Hilite.onload){if(window.attachEvent){window.attachEvent("onload",Hilite.hilite)}else{if(window.addEventListener){window.addEventListener("load",Hilite.hilite,false)}else{var __onload=window.onload;window.onload=function(){Hilite.hilite();__onload()}}}};
/* json2.js by D. Crockford */
if(!this.JSON){this.JSON={}}(function(){function f(n){return n<10?"0"+n:n}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==="object"&&typeof value.toJSON==="function"){value=value.toJSON(key)}if(typeof rep==="function"){value=rep.call(holder,key,value)}switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value){return"null"}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||"null"}v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]";gap=mind;return v}if(rep&&typeof rep==="object"){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==="string"){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}";gap=mind;return v}}if(typeof JSON.stringify!=="function"){JSON.stringify=function(value,replacer,space){var i;gap="";indent="";if(typeof space==="number"){for(i=0;i<space;i+=1){indent+=" "}}else{if(typeof space==="string"){indent=space}}rep=replacer;if(replacer&&typeof replacer!=="function"&&(typeof replacer!=="object"||typeof replacer.length!=="number")){throw new Error("JSON.stringify")}return str("",{"":value})}}if(typeof JSON.parse!=="function"){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==="object"){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")}}}());
//jquery fieldselection
(function(){var a={getSelection:function(){var b=this.jquery?this[0]:this;return(("selectionStart" in b&&function(){var c=b.selectionEnd-b.selectionStart;return{start:b.selectionStart,end:b.selectionEnd,length:c,text:b.value.substr(b.selectionStart,c)}})||(document.selection&&function(){b.focus();var d=document.selection.createRange();if(d==null){return{start:0,end:b.value.length,length:0}}var c=b.createTextRange();var e=c.duplicate();c.moveToBookmark(d.getBookmark());e.setEndPoint("EndToStart",c);return{start:e.text.length,end:e.text.length+d.text.length,length:d.text.length,text:d.text}})||function(){return{start:0,end:b.value.length,length:0}})()},replaceSelection:function(){var b=this.jquery?this[0]:this;var c=arguments[0]||"";return(("selectionStart" in b&&function(){b.value=b.value.substr(0,b.selectionStart)+c+b.value.substr(b.selectionEnd,b.value.length);return this})||(document.selection&&function(){b.focus();document.selection.createRange().text=c;return this})||function(){b.value+=c;return this})()}};jQuery.each(a,function(b){jQuery.fn[b]=this})})();
//our custom autocompleter
var AutoCompleter=function(a){var b={autocompleteMultiple:true,multipleSeparator:" ",inputClass:"acInput",loadingClass:"acLoading",resultsClass:"acResults",selectClass:"acSelect",queryParamName:"q",limitParamName:"limit",extraParams:{},lineSeparator:"\n",cellSeparator:"|",minChars:2,maxItemsToShow:10,delay:400,useCache:true,maxCacheLength:10,matchSubset:true,matchCase:false,matchInside:true,mustMatch:false,preloadData:false,selectFirst:false,stopCharRegex:/\s+/,selectOnly:false,formatItem:null,onItemSelect:false,autoFill:false,filterResults:true,sortResults:true,sortFunction:false,onNoMatch:false};this.options=$.extend({},b,a);this.cacheData_={};this.cacheLength_=0;this.selectClass_="jquery-autocomplete-selected-item";this.keyTimeout_=null;this.lastKeyPressed_=null;this.lastProcessedValue_=null;this.lastSelectedValue_=null;this.active_=false;this.finishOnBlur_=true;this.options.minChars=parseInt(this.options.minChars,10);if(isNaN(this.options.minChars)||this.options.minChars<1){this.options.minChars=2}this.options.maxItemsToShow=parseInt(this.options.maxItemsToShow,10);if(isNaN(this.options.maxItemsToShow)||this.options.maxItemsToShow<1){this.options.maxItemsToShow=10}this.options.maxCacheLength=parseInt(this.options.maxCacheLength,10);if(isNaN(this.options.maxCacheLength)||this.options.maxCacheLength<1){this.options.maxCacheLength=10}if(this.options.preloadData===true){this.fetchRemoteData("",function(){})}};inherits(AutoCompleter,WrappedElement);AutoCompleter.prototype.decorate=function(a){this._element=a;this._element.attr("autocomplete","off");this._results=$("<div></div>").hide();if(this.options.resultsClass){this._results.addClass(this.options.resultsClass)}this._results.css({position:"absolute"});$("body").append(this._results);this.setEventHandlers()};AutoCompleter.prototype.setEventHandlers=function(){var a=this;a._element.keydown(function(b){a.lastKeyPressed_=b.keyCode;switch(a.lastKeyPressed_){case 38:b.preventDefault();if(a.active_){a.focusPrev()}else{a.activate()}return false;break;case 40:b.preventDefault();if(a.active_){a.focusNext()}else{a.activate()}return false;break;case 9:case 13:if(a.active_){b.preventDefault();a.selectCurrent();return false}break;case 27:if(a.active_){b.preventDefault();a.finish();return false}break;default:a.activate()}});a._element.blur(function(){if(a.finishOnBlur_){setTimeout(function(){a.finish()},200)}})};AutoCompleter.prototype.position=function(){var a=this._element.offset();this._results.css({top:a.top+this._element.outerHeight(),left:a.left})};AutoCompleter.prototype.cacheRead=function(d){var f,c,b,a,e;if(this.options.useCache){d=String(d);f=d.length;if(this.options.matchSubset){c=1}else{c=f}while(c<=f){if(this.options.matchInside){a=f-c}else{a=0}e=0;while(e<=a){b=d.substr(0,c);if(this.cacheData_[b]!==undefined){return this.cacheData_[b]}e++}c++}}return false};AutoCompleter.prototype.cacheWrite=function(a,b){if(this.options.useCache){if(this.cacheLength_>=this.options.maxCacheLength){this.cacheFlush()}a=String(a);if(this.cacheData_[a]!==undefined){this.cacheLength_++}return this.cacheData_[a]=b}return false};AutoCompleter.prototype.cacheFlush=function(){this.cacheData_={};this.cacheLength_=0};AutoCompleter.prototype.callHook=function(c,b){var a=this.options[c];if(a&&$.isFunction(a)){return a(b,this)}return false};AutoCompleter.prototype.activate=function(){var b=this;var a=function(){b.activateNow()};var c=parseInt(this.options.delay,10);if(isNaN(c)||c<=0){c=250}if(this.keyTimeout_){clearTimeout(this.keyTimeout_)}this.keyTimeout_=setTimeout(a,c)};AutoCompleter.prototype.activateNow=function(){var a=this.getValue();if(a!==this.lastProcessedValue_&&a!==this.lastSelectedValue_){if(a.length>=this.options.minChars){this.active_=true;this.lastProcessedValue_=a;this.fetchData(a)}}};AutoCompleter.prototype.fetchData=function(b){if(this.options.data){this.filterAndShowResults(this.options.data,b)}else{var a=this;this.fetchRemoteData(b,function(c){a.filterAndShowResults(c,b)})}};AutoCompleter.prototype.fetchRemoteData=function(c,e){var d=this.cacheRead(c);if(d){e(d)}else{var a=this;if(this._element){this._element.addClass(this.options.loadingClass)}var b=function(g){var f=false;if(g!==false){f=a.parseRemoteData(g);a.options.data=f;a.cacheWrite(c,f)}if(a._element){a._element.removeClass(a.options.loadingClass)}e(f)};$.ajax({url:this.makeUrl(c),success:b,error:function(){b(false)}})}};AutoCompleter.prototype.setOption=function(a,b){this.options[a]=b};AutoCompleter.prototype.setExtraParam=function(b,c){var a=$.trim(String(b));if(a){if(!this.options.extraParams){this.options.extraParams={}}if(this.options.extraParams[a]!==c){this.options.extraParams[a]=c;this.cacheFlush()}}};AutoCompleter.prototype.makeUrl=function(e){var a=this;var b=this.options.url;var d=$.extend({},this.options.extraParams);if(this.options.queryParamName===false){b+=encodeURIComponent(e)}else{d[this.options.queryParamName]=e}if(this.options.limitParamName&&this.options.maxItemsToShow){d[this.options.limitParamName]=this.options.maxItemsToShow}var c=[];$.each(d,function(f,g){c.push(a.makeUrlParam(f,g))});if(c.length){b+=b.indexOf("?")==-1?"?":"&";b+=c.join("&")}return b};AutoCompleter.prototype.makeUrlParam=function(a,b){return String(a)+"="+encodeURIComponent(b)};AutoCompleter.prototype.splitText=function(a){return String(a).replace(/(\r\n|\r|\n)/g,"\n").split(this.options.lineSeparator)};AutoCompleter.prototype.parseRemoteData=function(c){var h,b,f,d,g;var e=[];var b=this.splitText(c);for(f=0;f<b.length;f++){var a=b[f].split(this.options.cellSeparator);g=[];for(d=0;d<a.length;d++){g.push(unescape(a[d]))}h=g.shift();e.push({value:unescape(h),data:g})}return e};AutoCompleter.prototype.filterAndShowResults=function(a,b){this.showResults(this.filterResults(a,b),b)};AutoCompleter.prototype.filterResults=function(d,b){var f=[];var l,c,e,m,j,a;var k,h,g;for(e=0;e<d.length;e++){m=d[e];j=typeof m;if(j==="string"){l=m;c={}}else{if($.isArray(m)){l=m[0];c=m.slice(1)}else{if(j==="object"){l=m.value;c=m.data}}}l=String(l);if(l>""){if(typeof c!=="object"){c={}}if(this.options.filterResults){h=String(b);g=String(l);if(!this.options.matchCase){h=h.toLowerCase();g=g.toLowerCase()}a=g.indexOf(h);if(this.options.matchInside){a=a>-1}else{a=a===0}}else{a=true}if(a){f.push({value:l,data:c})}}}if(this.options.sortResults){f=this.sortResults(f,b)}if(this.options.maxItemsToShow>0&&this.options.maxItemsToShow<f.length){f.length=this.options.maxItemsToShow}return f};AutoCompleter.prototype.sortResults=function(c,d){var b=this;var a=this.options.sortFunction;if(!$.isFunction(a)){a=function(g,e,h){return b.sortValueAlpha(g,e,h)}}c.sort(function(f,e){return a(f,e,d)});return c};AutoCompleter.prototype.sortValueAlpha=function(d,c,e){d=String(d.value);c=String(c.value);if(!this.options.matchCase){d=d.toLowerCase();c=c.toLowerCase()}if(d>c){return 1}if(d<c){return -1}return 0};AutoCompleter.prototype.showResults=function(e,b){var k=this;var g=$("<ul></ul>");var f,l,j,a,h=false,d=false;var c=e.length;for(f=0;f<c;f++){l=e[f];j=$("<li>"+this.showResult(l.value,l.data)+"</li>");j.data("value",l.value);j.data("data",l.data);j.click(function(){var i=$(this);k.selectItem(i)}).mousedown(function(){k.finishOnBlur_=false}).mouseup(function(){k.finishOnBlur_=true});g.append(j);if(h===false){h=String(l.value);d=j;j.addClass(this.options.firstItemClass)}if(f==c-1){j.addClass(this.options.lastItemClass)}}this.position();this._results.html(g).show();a=this._results.outerWidth()-this._results.width();this._results.width(this._element.outerWidth()-a);$("li",this._results).hover(function(){k.focusItem(this)},function(){});if(this.autoFill(h,b)){this.focusItem(d)}};AutoCompleter.prototype.showResult=function(b,a){if($.isFunction(this.options.showResult)){return this.options.showResult(b,a)}else{return b}};AutoCompleter.prototype.autoFill=function(e,c){var b,a,d,f;if(this.options.autoFill&&this.lastKeyPressed_!=8){b=String(e).toLowerCase();a=String(c).toLowerCase();d=e.length;f=c.length;if(b.substr(0,f)===a){this._element.val(e);this.selectRange(f,d);return true}}return false};AutoCompleter.prototype.focusNext=function(){this.focusMove(+1)};AutoCompleter.prototype.focusPrev=function(){this.focusMove(-1)};AutoCompleter.prototype.focusMove=function(a){var b,c=$("li",this._results);a=parseInt(a,10);for(var b=0;b<c.length;b++){if($(c[b]).hasClass(this.selectClass_)){this.focusItem(b+a);return}}this.focusItem(0)};AutoCompleter.prototype.focusItem=function(b){var a,c=$("li",this._results);if(c.length){c.removeClass(this.selectClass_).removeClass(this.options.selectClass);if(typeof b==="number"){b=parseInt(b,10);if(b<0){b=0}else{if(b>=c.length){b=c.length-1}}a=$(c[b])}else{a=$(b)}if(a){a.addClass(this.selectClass_).addClass(this.options.selectClass)}}};AutoCompleter.prototype.selectCurrent=function(){var a=$("li."+this.selectClass_,this._results);if(a.length==1){this.selectItem(a)}else{this.finish()}};AutoCompleter.prototype.selectItem=function(d){var c=d.data("value");var b=d.data("data");var a=this.displayValue(c,b);this.lastProcessedValue_=a;this.lastSelectedValue_=a;this.setValue(a);this.setCaret(a.length);this.callHook("onItemSelect",{value:c,data:b});this.finish()};AutoCompleter.prototype.isContentChar=function(a){if(a.match(this.options.stopCharRegex)){return false}else{if(a===this.options.multipleSeparator){return false}else{return true}}};AutoCompleter.prototype.getValue=function(){var c=this._element.getSelection();var d=this._element.val();var f=c.start;var e=f;for(cpos=f;cpos>=0;cpos=cpos-1){if(cpos===d.length){continue}var b=d.charAt(cpos);if(!this.isContentChar(b)){break}e=cpos}var a=f;for(cpos=f;cpos<d.length;cpos=cpos+1){if(cpos===0){continue}var b=d.charAt(cpos);if(!this.isContentChar(b)){break}a=cpos}this._selection_start=e;this._selection_end=a;return d.substring(e,a)};AutoCompleter.prototype.setValue=function(b){var a=this._element.val().substring(0,this._selection_start);var c=this._element.val().substring(this._selection_end+1);this._element.val(a+b+c)};AutoCompleter.prototype.displayValue=function(b,a){if($.isFunction(this.options.displayValue)){return this.options.displayValue(b,a)}else{return b}};AutoCompleter.prototype.finish=function(){if(this.keyTimeout_){clearTimeout(this.keyTimeout_)}if(this._element.val()!==this.lastSelectedValue_){if(this.options.mustMatch){this._element.val("")}this.callHook("onNoMatch")}this._results.hide();this.lastKeyPressed_=null;this.lastProcessedValue_=null;if(this.active_){this.callHook("onFinish")}this.active_=false};AutoCompleter.prototype.selectRange=function(d,a){var c=this._element.get(0);if(c.setSelectionRange){c.focus();c.setSelectionRange(d,a)}else{if(this.createTextRange){var b=this.createTextRange();b.collapse(true);b.moveEnd("character",a);b.moveStart("character",d);b.select()}}};AutoCompleter.prototype.setCaret=function(a){this.selectRange(a,a)};
(function($){function isRGBACapable(){var $script=$("script:first"),color=$script.css("color"),result=false;if(/^rgba/.test(color)){result=true}else{try{result=(color!=$script.css("color","rgba(0, 0, 0, 0.5)").css("color"));$script.css("color",color)}catch(e){}}return result}$.extend(true,$,{support:{rgba:isRGBACapable()}});var properties=["color","backgroundColor","borderBottomColor","borderLeftColor","borderRightColor","borderTopColor","outlineColor"];$.each(properties,function(i,property){$.fx.step[property]=function(fx){if(!fx.init){fx.begin=parseColor($(fx.elem).css(property));fx.end=parseColor(fx.end);fx.init=true}fx.elem.style[property]=calculateColor(fx.begin,fx.end,fx.pos)}});$.fx.step.borderColor=function(fx){if(!fx.init){fx.end=parseColor(fx.end)}var borders=properties.slice(2,6);$.each(borders,function(i,property){if(!fx.init){fx[property]={begin:parseColor($(fx.elem).css(property))}}fx.elem.style[property]=calculateColor(fx[property].begin,fx.end,fx.pos)});fx.init=true};function calculateColor(begin,end,pos){var color="rgb"+($.support.rgba?"a":"")+"("+parseInt((begin[0]+pos*(end[0]-begin[0])),10)+","+parseInt((begin[1]+pos*(end[1]-begin[1])),10)+","+parseInt((begin[2]+pos*(end[2]-begin[2])),10);if($.support.rgba){color+=","+(begin&&end?parseFloat(begin[3]+pos*(end[3]-begin[3])):1)}color+=")";return color}function parseColor(color){var match,triplet;if(match=/#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/.exec(color)){triplet=[parseInt(match[1],16),parseInt(match[2],16),parseInt(match[3],16),1]}else{if(match=/#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])/.exec(color)){triplet=[parseInt(match[1],16)*17,parseInt(match[2],16)*17,parseInt(match[3],16)*17,1]}else{if(match=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color)){triplet=[parseInt(match[1]),parseInt(match[2]),parseInt(match[3]),1]}else{if(match=/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9\.]*)\s*\)/.exec(color)){triplet=[parseInt(match[1],10),parseInt(match[2],10),parseInt(match[3],10),parseFloat(match[4])]}else{if(color=="transparent"){triplet=[0,0,0,0]}}}}}return triplet}})(jQuery);

/**
 * Timeago is a jQuery plugin that makes it easy to support automatically
 * updating fuzzy timestamps (e.g. "4 minutes ago" or "about 1 day ago").
 *
 * @name timeago
 * @version 0.11.1
 * @requires jQuery v1.2.3+
 * @author Ryan McGeary
 * @license MIT License - http://www.opensource.org/licenses/mit-license.php
 *
 * For usage and examples, visit:
 * http://timeago.yarp.com/
 *
 * Copyright (c) 2008-2011, Ryan McGeary (ryanonjavascript -[at]- mcgeary [*dot*] org)
 */
(function($) {
  $.timeago = function(timestamp) {
    if (timestamp instanceof Date) {
      return inWords(timestamp);
    } else if (typeof timestamp === "string") {
      return inWords($.timeago.parse(timestamp));
    } else {
      return inWords($.timeago.datetime(timestamp));
    }
  };
  var $t = $.timeago;

  $.extend($.timeago, {
    settings: {
      refreshMillis: 60000,
      allowFuture: false,
      strings: {
        prefixAgo: null,
        prefixFromNow: null,
        suffixAgo: gettext("ago"),
        suffixFromNow: gettext("from now"),
        seconds: gettext("just now"),
        minute: gettext("about a minute"),
        minutes: gettext("%d minutes"),
        hour: gettext("about an hour"),
        hours: gettext("%d hours"),
        day: gettext("yesterday"),
        days: gettext("%d days"),
        month: gettext("about a month"),
        months: gettext("%d months"),
        year: gettext("about a year"),
        years: gettext("%d years"),
        wordSeparator: " ",
        numbers: []
      }
    },
    inWords: function(distanceMillis) {
      var $l = this.settings.strings;
      var prefix = $l.prefixAgo;
      var suffix = $l.suffixAgo;
      if (this.settings.allowFuture) {
        if (distanceMillis < 0) {
          prefix = $l.prefixFromNow;
          suffix = $l.suffixFromNow;
        }
      }

      var seconds = Math.abs(distanceMillis) / 1000;
      var minutes = seconds / 60;
      var hours = minutes / 60;
      var days = hours / 24;
      var years = days / 365;

      function substitute(stringOrFunction, number) {
        var string = $.isFunction(stringOrFunction) ? stringOrFunction(number, distanceMillis) : stringOrFunction;
        var value = ($l.numbers && $l.numbers[number]) || number;
        return string.replace(/%d/i, value);
      }

      var words = seconds < 45 && substitute($l.seconds, Math.round(seconds)) ||
        seconds < 90 && substitute($l.minute, 1) ||
        minutes < 45 && substitute($l.minutes, Math.round(minutes)) ||
        minutes < 90 && substitute($l.hour, 1) ||
        hours < 24 && substitute($l.hours, Math.round(hours)) ||
        hours < 42 && substitute($l.day, 1) ||
        days < 30 && substitute($l.days, Math.round(days)) ||
        days < 45 && substitute($l.month, 1) ||
        days < 365 && substitute($l.months, Math.round(days / 30)) ||
        years < 1.5 && substitute($l.year, 1) ||
        substitute($l.years, Math.round(years));

      var separator = $l.wordSeparator === undefined ?  " " : $l.wordSeparator;
      return $.trim([prefix, words, suffix].join(separator));
    },
    parse: function(iso8601) {
      var s = $.trim(iso8601);
      s = s.replace(/\.\d\d\d+/,""); // remove milliseconds
      s = s.replace(/-/,"/").replace(/-/,"/");
      s = s.replace(/T/," ").replace(/Z/," UTC");
      s = s.replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"); // -04:00 -> -0400
      return new Date(s);
    },
    datetime: function(elem) {
      // jQuery's `is()` doesn't play well with HTML5 in IE
      var isTime = $(elem).get(0).tagName.toLowerCase() === "time"; // $(elem).is("time");
      var iso8601 = isTime ? $(elem).attr("datetime") : $(elem).attr("title");
      return $t.parse(iso8601);
    }
  });

  $.fn.timeago = function() {
    var self = this;
    self.each(refresh);

    var $s = $t.settings;
    if ($s.refreshMillis > 0) {
      setInterval(function() { self.each(refresh); }, $s.refreshMillis);
    }
    return self;
  };

  function refresh() {
    var data = prepareData(this);
    if (!isNaN(data.datetime)) {
      $(this).text(inWords(data.datetime));
    }
    return this;
  }

  function prepareData(element) {
    element = $(element);
    if (!element.data("timeago")) {
      element.data("timeago", { datetime: $t.datetime(element) });
      var text = $.trim(element.text());
      if (text.length > 0) {
        element.attr("title", text);
      }
    }
    return element.data("timeago");
  }

  function inWords(date) {
    var distanceMillis = distance(date);
    var seconds = Math.abs(distanceMillis) / 1000;
    var minutes = seconds / 60;
    var hours = minutes / 60;
    var days = hours / 24;
    var years = days / 365;
    var months = [
        gettext('Jan'),
        gettext('Feb'),
        gettext('Mar'),
        gettext('Apr'),
        gettext('May'),
        gettext('Jun'),
        gettext('Jul'),
        gettext('Aug'),
        gettext('Sep'),
        gettext('Oct'),
        gettext('Nov'),
        gettext('Dec')
    ];
    //todo: rewrite this in javascript
    if (days > 2){
        var month_date = months[date.getMonth()] + ' ' + date.getDate()
        if (years == 0){
            //how to do this in js???
            return month_date;
        } else {
            return month_date + ' ' + "'" + date.getYear() % 20;
        }
    } else if (days == 2) {
        return gettext('2 days ago')
    } else if (days == 1) {
        return gettext('yesterday')
    } else if (minutes >= 60) {
        return interpolate(
                    ngettext(
                        '%s hour ago',
                        '%s hours ago',
                        hours
                    ),
                    [Math.floor(hours),]
                )
    } else if (seconds > 90){
        return interpolate(
                    ngettext(
                        '%s min ago',
                        '%s mins ago',
                        minutes
                    ),
                    [Math.floor(minutes),]
                )
    } else {
        return gettext('just now')
    }
  }

  function distance(date) {
    return (new Date() - date);
  }

  // fix for IE6 suckage
  document.createElement("abbr");
  document.createElement("time");
}(jQuery));
