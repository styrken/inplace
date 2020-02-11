/*!
 * Inplace - An inplace editor
 *
 * The MIT License
 *
 * @author:  Washington Botelho
 * @doc:     wbotelhos.com/inplace
 * @version: 0.1.0
 *
 */

;
(function($) {
  'use strict';

  $.inplace = {
    fieldClass:    'inplace__field',
    fieldName:     undefined,
    fieldTemplate: '{name}',
    method:        'PATCH'
  }

  $.fn.inplace = function(options) {
    return this.each(function() {
      return (new $.inplace.Inplace(this, options))._create();
    });
  }

  $.inplace.Inplace = (function() {
    var Inplace = function(element, options) {
      this.el      = $(element);
      this.element = element;
      this.options = $.extend({}, $.inplace, options, this.el.data());
    }

    Inplace.prototype = {
      _activate: function() {
        var field = this._build(this.el.data('field-type') || "textfield");

        this
          .el
          .off('click.inplace.el')
          .addClass('inplace--active')
          .html(field)
          .trigger('inplace:activate', this.element);

        // Cancel other opene inplace editors
        var actived = $('.inplace--active').not(this.el);

        for (var i = 0; i < actived.length; i++) {
          actived.data('inplace')._deactivate();
        }

        // Focus element
        field.trigger('focus');

        // Bind on blur to cancel or save when user leaves field
        field.blur(this._blurred.bind(this));
      },

      _bindClick: function() {
        this.el.on('click.inplace.el', this._activate.bind(this));
      },

      _build: function(type) {
        var options = {
          'class': this.options['fieldClass'],
          'value': this.options['fieldValue']
        };

        var attributes = this.el.data('attributes');
        if (attributes) {
          options = $.extend({}, options, attributes);
        }

        options['data-inplace-field'] = '';

        if (type == 'textfield') {
          options["type"] = type;
          return $('<input />', options);
        }

        const val = options["value"];
        delete options["type"];
        delete options["value"];
        options["rows"] = this.el.data("rows") || 5;

        if (type === 'textarea') {
          return $('<textarea />', options).append(val);
        }

        if (type === 'select') {
          let optionHtml = [];

          if(this.el.data("option-deselected-title")) {
            optionHtml.push($("<option/>", {value: 0}).append(this.el.data("option-deselected-title")));
          }

          const currentVal = this.element.getAttribute('data-field-value');

          this.el.data('options').forEach(function(elm) {
            if (currentVal == elm[0]) {
              optionHtml.push($("<option/>", {value: elm[0], selected: "selected"}).append(elm[1]));
            } else {
              optionHtml.push($("<option/>", {value: elm[0]}).append(elm[1]));
            }
          });

          return $('<select />', options).append(optionHtml);
        }

        return $("<div>unsupported: " + type + "</div>")
      },

      _create: function() {
        this._bindClick();
        this.el.data('inplace', this);
        return this;
      },

      _deactivate: function() {
        this._bindClick();

        let val = this.element.getAttribute('data-field-value');
        if (this.options['fieldType'] === "select") {
          val = this.el.find('[data-inplace-field] option:selected').html();
        }

        this
          .el
          .removeClass('inplace--active')
          .html(val)
          .trigger('inplace:deactivate', this.element);
      },

      _done: function(json) {
        this._deactivate();

        this.options.fieldValue = json[this.options.fieldName];
        this.element.setAttribute('data-field-value', this.options.fieldValue);
        this.el.trigger('inplace:done', json);
      },

      _blurred: function() {
        const currentValue = this.el.find('[data-inplace-field]').val();
        const oldValue = this.options.fieldValue;

        if (currentValue == oldValue) {
          this._deactivate();
        } else {
          this._request();
        }
      },

      _request: function() {
        $.ajax(this._requestOptions()).done(this._done.bind(this));
      },

      _requestOptions: function() {
        var data = {};
        var name = this.options.fieldTemplate.replace('{name}', this.options.fieldName);

        data[name] = this.el.find('[data-inplace-field]').val();

        return { data: data, method: this.options.method, url: this.options.url };
      }
    };

    return Inplace;
  })();
})(jQuery);
