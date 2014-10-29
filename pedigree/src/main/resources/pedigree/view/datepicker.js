var PhenoTips = (function (PhenoTips) {
  var widgets = PhenoTips.widgets = PhenoTips.widgets || {};

  widgets.FuzzyDatePickerDropdown = Class.create({
    initialize : function(options) {
      this.dropdown = new Element('select', {
        "name"        : options.name     || '',
        "class"       : options.cssClass || options.name || '',
        "placeholder" : options.hint     || options.name || '',
        "title"       : options.hint     || options.name || ''
      });
    },

    populate : function(values) {
      var selectedIndex = this.dropdown.selectedIndex || this._tmpSelectedIndex;
      this.dropdown.update(new Element('option', {'value' : "", "class" : "empty"}));
      var _this = this;
      values.each(function (item) {
         var optionData = {};
         optionData.value = item.value;
         if (item.cssClass) {
            optionData["class"] = item.cssClass;
         }
         //if (item.value == selectedValue) {
         //   optionData.selected = "selected";
         //}
         _this.dropdown.insert(new Element('option', optionData).update(item.text || item.value || ''));
      });
      if (this.dropdown.selectedIndex <= 0 && selectedIndex >= 0 && selectedIndex < this.dropdown.options.length) {
        this.dropdown.selectedIndex = selectedIndex;
      }
    },

    enable : function () {
      this.dropdown.enable();
      this.dropdown.focus();
      if (this.dropdown.selectedIndex <= 0 && this._tmpSelectedIndex < this.dropdown.options.length) {
        this.dropdown.selectedIndex = this._tmpSelectedIndex;
      }
    },

    disable : function () {
      this.dropdown.disable();
      this._tmpSelectedIndex = this.dropdown.selectedIndex;
      this.dropdown.selectedIndex = 0;
    },

    getElement : function() {
      return this.dropdown;
    },

    onSelect : function(callback) {
      var _this = this;
      this.dropdown.observe('change',function() {
        callback();
        _this._tmpSelectedIndex = _this.dropdown.selectedIndex;
      });
    },

    onFocus : function(callback) {
      var _this = this;
      this.dropdown.observe('focus', function() {
        callback();
        if (_this.dropdown.selectedIndex == -1 && _this._tmpSelectedIndex < _this.dropdown.options.size()) {
          _this.dropdown.selectedIndex = _this._tmpSelectedIndex;
        }
      });
    },
    onBlur : function(callback) {
      this.dropdown.observe('blur', callback);
    },

    getSelectedValue : function () {
       return (this.dropdown.selectedIndex >= 0) ? this.dropdown.options[this.dropdown.selectedIndex].value : '';
    },

    getSelectedOption : function () {
       return (this.dropdown.selectedIndex >= 0) ? this.dropdown.options[this.dropdown.selectedIndex].innerHTML : '';
    }
  });

  widgets.FuzzyDatePicker = Class.create({
    initialize : function (input) {
      if (!input) {return};
      this.__input = input;
      this.__input.hide();
      
      this.container = new Element('div', {'class' : 'fuzzy-date-picker'});
      this.__input.insert({after : this.container});      
      this.container.insert(this.createYearDropdown());
      this.container.insert(this.createMonthDropdown());
      this.container.insert(this.createDayDropdown());
      
      // TODO: yearSelector's (and month's & day's) .onSelect() does not seem to fire
      //       upon programmatic update if a substitute is found can remove these hackish events
      this.container.observe("datepicker:date:changed", this.onProgrammaticUpdate.bind(this));
    },

    onProgrammaticUpdate : function() {
        this.yearSelected();
        this.monthSelected();
        this.updateDate();
    },
    
    createYearDropdown : function() {
      this.yearSelector = new widgets.FuzzyDatePickerDropdown({name: "year"});

      var today = new Date();
      var crtYear = today.getYear() + 1900;
      var startYear = 1900;

      var values = [];
      for (var y = crtYear; y >= startYear; --y) {
        values.push({"value" : y});
        if (y % 10 == 0) {
            values.push({"value" : (y + "s"), "cssClass" : "decade", "text" : (y + 's')});
        }        
      }
      values.push({"value": "1800s"});
      values.push({"value": "1700s"});
      values.push({"value": "1600s"});

      this.yearSelector.populate(values);
      this.yearSelector.onSelect(this.yearSelected.bind(this));

      return this.yearSelector.getElement();
    },

    yearSelected : function() {
      if (this.yearSelector.getSelectedValue() > 0) {
        this.monthSelector.enable();
      } else {
        this.monthSelector.disable();
        this.daySelector.disable();
      }
      this.updateDate();
    },

    createMonthDropdown : function() {
      this.monthSelector = new widgets.FuzzyDatePickerDropdown({name: "month"});
      this.monthSelector.populate(this.getZeroPaddedValueRange(1,12));
      this.monthSelector.disable();
      this.monthSelector.onSelect(this.monthSelected.bind(this));
      return this.monthSelector.getElement();
    },

    monthSelected : function() {
      if (this.monthSelector.getSelectedValue() > 0) {
        this.daySelector.populate(this.getAvailableDays());
        this.daySelector.enable();
      } else {
        this.daySelector.disable();
      }
      this.updateDate();
    },

    createDayDropdown : function() {
      this.daySelector = new widgets.FuzzyDatePickerDropdown({name: "day"});
      this.daySelector.disable();
      this.daySelector.populate(this.getZeroPaddedValueRange(1,31));
      this.daySelector.onSelect(this.updateDate.bind(this));
      return this.daySelector.getElement();
    },

    getAvailableDays : function () {
      var year = this.yearSelector.getSelectedValue() * 1;
      var month = this.monthSelector.getSelectedValue() * 1;
      var lastDayOfMonth = 0;
      if ([1,3,5,7,8,10,12].indexOf(month) >= 0) {
        lastDayOfMonth = 31;
      } else if ([4,6,9,11].indexOf(month) >= 0) {
        lastDayOfMonth = 30
      } else if (month == 2) {
        if (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) {
          lastDayOfMonth = 29;
        } else {
          lastDayOfMonth = 28;
        }
      }
      return this.getZeroPaddedValueRange(1, lastDayOfMonth);
    },

    getZeroPaddedValueRange : function (start, end) {
      var values = [];
      if (start <= end) {
          for (var v = start; v <= end; ++v) {
              values.push({'value': v, 'text' : ("0" + v).slice(-2)});
          }
      } else {
          for (var v = end; v <= start; --v) {
              values.push({'value': v, 'text' : ("0" + v).slice(-2)});
          }          
      }
      return values;
    },
    
    updateDate : function () {
        var dateObject = {};

        var y = this.yearSelector.getSelectedValue();
        if (y.match(/\d\d\d\ds$/)) {
            dateObject["decade"] = y;
        } else {
            if (y != "") {
                dateObject["year"] = y;
            }
        }

        if (y > 0) {
            var m = this.monthSelector.getSelectedValue();
            if (m > 0) {
                dateObject["month"] = this.monthSelector.getSelectedOption();
            
                var d = this.daySelector.getSelectedValue();
                if (d > 0) {
                    dateObject["day"] = this.daySelector.getSelectedOption();
                }
            }
        }

        var newValue = JSON.stringify(dateObject);
        if (newValue != this.__input.value) {
            this.__input.value = JSON.stringify(dateObject);        
            this.__input.fire("xwiki:date:changed");
        }
    }
  });

  var init = function(event) {
    ((event && event.memo.elements) || [$('body')]).each(function(element) {
      (element.hasClassName("fuzzy-date") ? [element] : element.select(".fuzzy-date")).each(function(dateInput) {
        if (!dateInput.__datePicker) {
          dateInput.__datePicker = new PhenoTips.widgets.FuzzyDatePicker(dateInput);
        }
      });
    });
    return true;
  };

  (XWiki.domIsLoaded && init()) || document.observe("xwiki:dom:loaded", init);
  document.observe("xwiki:dom:updated", init);

  // End augmentation.

  return PhenoTips;
}(PhenoTips || {}));