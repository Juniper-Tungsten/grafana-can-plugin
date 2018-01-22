'use strict';

System.register(['lodash', './css/query-editor.css!', './common'], function (_export, _context) {
  "use strict";

  var _, Common, _createClass, GenericAnnotationsQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_cssQueryEditorCss) {}, function (_common) {
      Common = _common.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('GenericAnnotationsQueryCtrl', GenericAnnotationsQueryCtrl = function () {
        function GenericAnnotationsQueryCtrl() {
          _classCallCheck(this, GenericAnnotationsQueryCtrl);

          this.annontation = {};
          this.allCols = null;
          this.indexCols = null;
          this.indexCols = this.getIndexCols();
          this.allCols = this.getAllCols();
        }

        _createClass(GenericAnnotationsQueryCtrl, [{
          key: 'getOperators',
          value: function getOperators() {
            return Common.allOperators;
          }
        }, {
          key: 'getIndexCols',
          value: function getIndexCols() {
            var _this = this;

            if (this.indexCols) return this.indexCols;
            var selectedTable = Common.annotationTable;
            return this.datasource.getColumns(selectedTable).then(function (result) {
              _this.indexCols = [];
              _.each(result.unfiltered, function (d, i) {
                if (d.index === true) {
                  _this.indexCols.push(d.text);
                }
              });
              return _this.indexCols;
            });
          }
        }, {
          key: 'getAllCols',
          value: function getAllCols() {
            var _this2 = this;

            if (this.allCols) return this.allCols;
            var selectedTable = Common.annotationTable;
            return this.datasource.getColumns(selectedTable).then(function (result) {
              _this2.allCols = [];
              _.each(result.unfiltered, function (d, i) {
                _this2.allCols.push(d.text);
              });
              return _this2.allCols;
            });
          }
        }]);

        return GenericAnnotationsQueryCtrl;
      }());

      _export('GenericAnnotationsQueryCtrl', GenericAnnotationsQueryCtrl);

      GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
    }
  };
});
//# sourceMappingURL=annotation_ctrl.js.map
