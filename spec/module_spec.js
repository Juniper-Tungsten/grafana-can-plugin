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

import {Datasource} from '../module';
import {QueryOptionsCtrl} from '../module';
import {AnnotationsQueryCtrl} from '../module';
import {ConfigCtrl} from '../module';
import {QueryCtrl} from '../module';

describe('Module', function () {
  it('[QueryCtrl] should have a templateUrl', function (done) {
    expect(QueryCtrl.templateUrl).to.not.be.undefined;
    expect(QueryCtrl.templateUrl).to.be.equal('partials/query.editor.html');
    done();
  });

  it('[ConfigCtrl] should have a templateUrl', function (done) {
    expect(ConfigCtrl.templateUrl).to.not.be.undefined;
    expect(ConfigCtrl.templateUrl).to.be.equal('partials/config.html');
    done();
  });

  it('[ConfigCtrl] should have reuse variables from this', function (done) {
    ConfigCtrl.prototype.current = {
      url: 'someUrl',
      jsonData: {
        keystoneUrl: 'keystoneUrl',
        canPassword: 'canp',
        canUsername: 'canU'
      }
    };
    let configCtrlObj = new ConfigCtrl({});
    expect(configCtrlObj.current.url).to.be.equal('someUrl');
    expect(configCtrlObj.current.jsonData.keystoneUrl).to.be.equal('keystoneUrl');
    expect(configCtrlObj.current.jsonData.canPassword).to.be.equal('canp');
    expect(configCtrlObj.current.jsonData.canUsername).to.be.equal('canU');
    done();
  });

  it('[QueryOptionsCtrl] should have a templateUrl', function (done) {
    expect(QueryOptionsCtrl.templateUrl).to.not.be.undefined;
    expect(QueryOptionsCtrl.templateUrl).to.be.equal('partials/query.options.html');
    done();
  });

  it('[AnnotationsQueryCtrl] should have a templateUrl', function (done) {
    expect(AnnotationsQueryCtrl.templateUrl).to.not.be.undefined;
    expect(AnnotationsQueryCtrl.templateUrl).to.be.equal('partials/annotations.editor.html');
    done();
  });
});
