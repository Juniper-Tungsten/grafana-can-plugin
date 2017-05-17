//  Copyright 2017, Juniper Networks, Inc.

//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

const Common = {};
import _ from 'lodash';
export default Common;
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
Common.annotationCol = ['MessageTS', 'Source', 'ModuleId', 'Category', 'Messagetype', 'SequenceNum', 'Xmlmessage', 'Type'];
Common.annotationTable = 'MessageTable';
Common.strings = {
  'selectTable': 'Select Table',
  'selectColumn': 'Select Field'
};
Common.allOperators = ['EQUAL', 'NOT_EQUAL', 'IN_RANGE', 'NOT_IN_RANGE', 'LEQ', 'GEQ', 'PREFIX', 'REGEX_MATCH'];
Common.filteredCol = ['t', 't=', 'class(t)', 'class(t=)'];
Common.numTypes = ['int', 'long', 'percentiles', 'double', 'avg'];
Common.toDate = function (someDate) {
  if (someDate !== null && typeof someDate === 'object') {
    const timeString = someDate._d || someDate._i;
    return Date.parse(timeString) * 1000;
  }
  // else if (someDate !== null && typeof someDate === 'string') {
  //   return datemath().parse(someDate) * 1000;
  // }
};
Common.getAuthDict = function (user, pass, tenant = 'admin') {
  return {auth: {passwordCredentials: {username: user,
    password: pass},
    tenantName: tenant}};
};
Common.processAuthResponse = function (resp) {
  const response = resp.data;
  if (resp.status === 200 && response.access != null) {
    return {token: response.access.token.id,
      expire: response.access.token.expires
    };
  }
  return null;
};
Common.processResultData = function (result) {
    // TODO: normalize data here
  const newData = [];
  _.each(result.data.value, (d, i) => {
    const time = d.T;
    _.each(d, (v, k) => {
      if (k != 'T' && k != 'CLASS(T)') { newData.push([v, time / 1000]); }
    });
  });
  return {'target': result.config.data.select_fields[1], 'datapoints': newData};
};
Common.filterQueryFields = function (targetObj) {
  const whereArray = [];
  if (!targetObj.advanced) {
    targetObj.where = null;
    targetObj.filter = null;
  } else {
    _.each(targetObj.whereArray, (andRowArray, i) => {
      const innerArray = [];
      _.each(andRowArray, (andRow, j) => {
        if (!andRow.op ||
            !andRow.name ||
            !andRow.value ||
            (andRow.op &&
              andRow.op.toLowerCase().indexOf('range') !== -1 &&
              !andRow.value2)
            ) { return false; }
        innerArray.push({
          name: andRow.name,
          op: andRow.op,
          value: andRow.value,
          value2: andRow.value2
        });
      });
      if (innerArray.length === 0) { return false; }
      whereArray.push(innerArray);
    });
    targetObj.where = whereArray.length === 0 ? null : whereArray;
    const filterObj = targetObj.filterObj;
    targetObj.filter = filterObj;
    if (!targetObj.selCol ||
            targetObj.selCol === Common.strings.selectColumn ||
            !filterObj ||
            !filterObj.selFilterOp ||
            !filterObj.filterVal ||
            (filterObj.selFilterOp &&
                filterObj.selFilterOp.toLowerCase().indexOf('range') !== -1 &&
                !filterObj.filterVal2)) { targetObj.filter = null; }
  }
  return targetObj;
};
Common.isValidQuery = function (targetObj) {
  if (!targetObj.table ||
      !targetObj.selCol ||
      !targetObj.selCol === Common.strings.selectColumn) { return false; }
  return true;
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
    _.each(targetObj.where, (andRowArray, i) => {
      _.each(andRowArray, (andRow, j) => {
        targetObj.where[i][j].name = targetObj.where[i][j].name;
        targetObj.where[i][j].op = Common.allOperators.indexOf(targetObj.where[i][j].op) + 1;
      });
    });
  }
  return targetObj;
};
Common.processAnnotationResult = function (result, options) {
  const newData = [];
  if (result.status !== 200) { return newData; }
  if (options.alarm) {
    if (result.data.hasOwnProperty('UVEAlarms')) {
      _.each(result.data.UVEAlarms.alarms, (d, i) => {
        const singleAnnotation = {
          annotation: {
            name: options.name,
            enabled: options.enable,
            datasource: options.datasource
          },
          title: options.alarmUVEName + '\\' + options.alarmNodeName,
          time: d.timestamp / 1000,
          text: 'Description: ' + d.description,
          tags: ['Severity: ' + d.severity, d.type]
        };
        newData.push(singleAnnotation);
      });
    } else if (result.data.hasOwnProperty('value')) {
      _.each(result.data.value, (node, i) => {
        _.each(node.value.UVEAlarms.alarms, (d, j) => {
          const singleAnnotation = {
            annotation: {
              name: options.name,
              enabled: options.enable,
              datasource: options.datasource
            },
            title: node.name,
            time: d.timestamp / 1000,
            text: 'Description: ' + d.description,
            tags: ['Severity: ' + d.severity, d.type]
          };
          newData.push(singleAnnotation);
        });
      });
    }
  } else {
    _.each(result.data.value, (d, i) => {
      const singleAnnotation = {
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
