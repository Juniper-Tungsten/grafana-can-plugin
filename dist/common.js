'use strict';

System.register(['lodash'], function (_export, _context) {
  "use strict";

  var _, _typeof, Common;

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
      } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
      Common = {};

      _export('default', Common);

      // class Common {}
      Common.endpoints = {
        'query': '/analytics/query',
        'tables': '/analytics/tables',
        'table': '/analytics/table',
        'tableSchema': '/schema',
        'alarm': '/analytics/uves'
      };
      Common.allTableTableName = 'StatTable.FieldNames.fields';
      Common.annotationTs = 'MessageTS';
      Common.annotationColIndex = ['MessageTS', 'Source', 'ModuleId', 'Category', 'Messagetype', 'SequenceNum', 'Xmlmessage', 'Type'];
      Common.annotationColAll = ['MessageTS', 'Source', 'ModuleId', 'Category', 'Level', 'InstanceId', 'NodeType', 'Messagetype', 'Xmlmessage'];
      Common.annotationTable = 'MessageTable';
      Common.strings = {
        'selectTable': 'Select Table',
        'selectColumn': 'Select Field'
      };
      Common.allOperators = ['EQUAL', 'NOT_EQUAL', 'IN_RANGE', 'NOT_IN_RANGE', 'LEQ', 'GEQ', 'PREFIX', 'REGEX_MATCH'];
      Common.filteredCol = ['t', 't=', 'class(t)', 'class(t=)'];
      Common.numTypes = ['int', 'long', 'percentiles', 'double', 'avg'];
      Common.aggPrefix = ['SUM(', 'AVG(', 'MIN(', 'MAX(', 'PERCENTILES(', 'COUNT('];
      Common.toDate = function (someDate) {
        if (someDate !== null && (typeof someDate === 'undefined' ? 'undefined' : _typeof(someDate)) === 'object') {
          var timeString = someDate._d || someDate._i;
          return Date.parse(timeString) * 1000;
        }
        // else if (someDate !== null && typeof someDate === 'string') {
        //   return datemath().parse(someDate) * 1000;
        // }
      };
      Common.getAuthDict = function (user, pass) {
        var tenant = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'admin';

        return { auth: { passwordCredentials: { username: user,
              password: pass },
            tenantName: tenant } };
      };
      Common.processAuthResponse = function (resp) {
        var response = resp.data;
        if (resp.status === 200 && response.access != null) {
          return { token: response.access.token.id,
            expire: response.access.token.expires
          };
        }
        return null;
      };
      Common.processResultData = function (result) {
        // TODO: normalize data here
        var newData = [];
        _.each(result.data.value, function (d, i) {
          var time = d.T || d['T='];
          _.each(d, function (v, k) {
            if (k !== 'T' && k !== 'T=' && k !== 'CLASS(T=)' && k !== 'CLASS(T)') {
              newData.push([v, time / 1000]);
            }
          });
        });
        return { 'target': result.config.data.select_fields[1], 'datapoints': newData };
      };
      Common.filterQueryFields = function (targetObj) {
        var whereArray = [];
        if (!targetObj.advanced) {
          targetObj.where = null;
          targetObj.filter = null;
        } else {
          _.each(targetObj.whereArray, function (andRowArray, i) {
            var innerArray = [];
            _.each(andRowArray, function (andRow, j) {
              if (!andRow.op || !andRow.name || !andRow.value || andRow.op && andRow.op.toLowerCase().indexOf('range') !== -1 && !andRow.value2) {
                return false;
              }
              innerArray.push({
                name: andRow.name,
                op: andRow.op,
                value: andRow.value,
                value2: andRow.value2
              });
            });
            if (innerArray.length === 0) {
              return false;
            }
            whereArray.push(innerArray);
          });
          targetObj.where = whereArray.length === 0 ? null : whereArray;
          var filterObj = targetObj.filterObj;
          targetObj.filter = filterObj;
          if (!targetObj.selCol || targetObj.selCol === Common.strings.selectColumn || !filterObj || !filterObj.selFilterOp || !filterObj.filterVal || filterObj.selFilterOp && filterObj.selFilterOp.toLowerCase().indexOf('range') !== -1 && !filterObj.filterVal2) {
            targetObj.filter = null;
          }
        }
        return targetObj;
      };
      Common.isValidQuery = function (targetObj) {
        if (!targetObj.table || !targetObj.selCol || !targetObj.selCol === Common.strings.selectColumn) {
          return false;
        }
        return true;
      };
      Common.isAggregateField = function (fieldName) {
        if (fieldName === undefined || fieldName === null) {
          return false;
        }
        for (var index = 0; index < Common.aggPrefix.length; ++index) {
          if (fieldName.indexOf(Common.aggPrefix[index]) === 0) {
            return true;
          }
        }
        return false;
      };
      Common.transform = function (targetObj) {
        if (targetObj.filter) {
          targetObj.filter = [{
            name: targetObj.selCol,
            value: targetObj.filter.filterVal,
            value2: targetObj.filter.filterVal2,
            op: Common.allOperators.indexOf(targetObj.filter.selFilterOp) + 1
          }];
        }
        if (targetObj.where) {
          _.each(targetObj.where, function (andRowArray, i) {
            _.each(andRowArray, function (andRow, j) {
              targetObj.where[i][j].name = targetObj.where[i][j].name;
              targetObj.where[i][j].op = Common.allOperators.indexOf(targetObj.where[i][j].op) + 1;
            });
          });
        }
        return targetObj;
      };
      Common.processAnnotationResult = function (result, options) {
        var newData = [];
        if (result.status !== 200) {
          return newData;
        }
        if (options.alarm) {
          if (result.data.hasOwnProperty('UVEAlarms')) {
            _.each(result.data.UVEAlarms.alarms, function (d, i) {
              var singleAnnotation = {
                annotation: {
                  name: options.name,
                  enabled: options.enable,
                  datasource: options.datasource
                },
                title: options.alarmUVEName + '\\' + options.alarmNodeName,
                time: d.timestamp / 1000,
                text: d.description,
                tags: ['Severity: ' + d.severity, d.type]
              };
              newData.push(singleAnnotation);
            });
          } else if (result.data.hasOwnProperty('value')) {
            _.each(result.data.value, function (node, i) {
              _.each(node.value.UVEAlarms.alarms, function (d, j) {
                var singleAnnotation = {
                  annotation: {
                    name: options.name,
                    enabled: options.enable,
                    datasource: options.datasource
                  },
                  title: node.name,
                  time: d.timestamp / 1000,
                  text: d.description,
                  tags: ['Severity: ' + d.severity, d.type]
                };
                newData.push(singleAnnotation);
              });
            });
          }
        } else {
          _.each(result.data.value, function (d, i) {
            var singleAnnotation = {
              annotation: {
                name: options.name,
                enabled: options.enable,
                datasource: options.datasource
              },
              title: d[options.titleMapping],
              time: d[Common.annotationTs] / 1000,
              text: d[options.textMapping],
              tags: d[options.tagMapping]
            };
            newData.push(singleAnnotation);
          });
        }
        return newData;
      };
    }
  };
});
//# sourceMappingURL=common.js.map
