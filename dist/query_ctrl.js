'use strict';

System.register(['lodash', 'app/plugins/sdk', './css/query-editor.css!', './common'], function (_export, _context) {
  "use strict";

  var _, QueryCtrl, Common, _createClass, GenericDatasourceQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_appPluginsSdk) {
      QueryCtrl = _appPluginsSdk.QueryCtrl;
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

      _export('GenericDatasourceQueryCtrl', GenericDatasourceQueryCtrl = function (_QueryCtrl) {
        _inherits(GenericDatasourceQueryCtrl, _QueryCtrl);

        function GenericDatasourceQueryCtrl($scope, $injector, uiSegmentSrv) {
          _classCallCheck(this, GenericDatasourceQueryCtrl);

          var _this = _possibleConstructorReturn(this, (GenericDatasourceQueryCtrl.__proto__ || Object.getPrototypeOf(GenericDatasourceQueryCtrl)).call(this, $scope, $injector));

          _this.scope = $scope;
          _this.uiSegmentSrv = uiSegmentSrv;
          _this.target.table = _this.target.table || Common.strings.selectTable;
          // TODO: support the table view.
          // TODO: support rawQuery
          _this.target.type = _this.target.type || 'timeserie';
          _this.target.pCols = _this.target.pCols || false;
          _this.target.selCol = _this.target.selCol || null;
          _this.target.allCols = _this.target.allCols || null;
          _this.target.advanced = _this.target.advanced || false;
          _this.target.filterObj = _this.target.filterObj || {};
          _this.target.filterObj.selFilterOp = _this.target.filterObj.selFilterOp || null;
          _this.target.filterObj.filterVal = _this.target.filterObj.filterVal || null;
          _this.target.filterObj.filterVal2 = _this.target.filterObj.filterVal2 || null;
          _this.target.whereArray = _this.target.whereArray || [[{ name: 'name', value: null, op: 'PREFIX' }]];
          _this.randomId = _this.randomId || 0;
          return _this;
        }

        _createClass(GenericDatasourceQueryCtrl, [{
          key: 'getTables',
          value: function getTables() {
            var param = {};
            param.start = Common.toDate(this.panelCtrl.dashboard.time.from);
            param.end = Common.toDate(this.panelCtrl.dashboard.time.end);
            return this.datasource.metricFindQuery(param).then(this.uiSegmentSrv.transformToSegments(false));
            // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
            // return this.datasource.metricFindQuery(this.target);
          }
        }, {
          key: 'toggleEditorMode',
          value: function toggleEditorMode() {
            this.target.rawQuery = !this.target.rawQuery;
          }
        }, {
          key: 'onChangeTable',
          value: function onChangeTable() {
            var _this2 = this;

            var selectedTable = this.target.table;
            if (!selectedTable.includes(Common.strings.selectTable)) {
              this.datasource.getColumns(selectedTable).then(function (result) {
                _this2.target.pCols = _.map(result.filtered, function (d, i) {
                  return d.text;
                });
                _this2.target.pCols.unshift(Common.strings.selectColumn);
                // this.target.pCols.unshift({text:Common.strings.selectColumn});
                _this2.target.allCols = result.unfiltered;
              });
            }
          }
        }, {
          key: 'colSelect',
          value: function colSelect() {
            // this.target.selCol = _.find(this.target.pCols, (obj)=>{
            //   return obj.text === this.target.viewSelCol;
            // });
            if (this.target.selCol) {
              this.panelCtrl.refresh();
            } // Asks the panel to refresh data.
          }
        }, {
          key: 'getOperators',
          value: function getOperators() {
            var colName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            if (colName != null) {
              // TODO: filter operators based on col datatype
              return Common.allOperators;
            }
            return Common.allOperators;
          }
        }, {
          key: 'addOrRow',
          value: function addOrRow() {
            this.target.whereArray.push([{}]);
          }
        }, {
          key: 'addAndRow',
          value: function addAndRow(index) {
            this.target.whereArray[index].push({});
          }
        }, {
          key: 'delAndRow',
          value: function delAndRow(pIndex, index) {
            this.target.whereArray[pIndex].splice(index, 1);
            if (this.target.whereArray[pIndex].length === 0) {
              this.target.whereArray.splice(pIndex, 1);
            }
          }
        }, {
          key: 'getIndexCols',
          value: function getIndexCols() {
            var filteredIndex = [];
            _.each(this.target.allCols, function (d, i) {
              if (d.index === true) {
                filteredIndex.push(d.text);
              }
            });
            return filteredIndex;
          }
        }, {
          key: 'getRandomId',
          value: function getRandomId() {
            // TODO: Solve this using the tabindex of the pointer a element up in the
            // parent hierarchy.
            this.randomId = 'chechbox-id' + Math.floor(Math.random() * 10000000);
            return this.randomId;
          }
        }, {
          key: 'isAggregateField',
          value: function isAggregateField(fieldName) {
            return Common.isAggregateField(fieldName);
          }
        }]);

        return GenericDatasourceQueryCtrl;
      }(QueryCtrl));

      _export('GenericDatasourceQueryCtrl', GenericDatasourceQueryCtrl);

      GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
    }
  };
});
//# sourceMappingURL=query_ctrl.js.map
