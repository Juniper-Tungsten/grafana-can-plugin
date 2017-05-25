// The MIT License (MIT)

// Copyright 2017, Juniper Networks, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

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
        canUsername: 'canU',
        canTenant: 'canTeen'
      }
    };
    let configCtrlObj = new ConfigCtrl({});
    expect(configCtrlObj.current.url).to.be.equal('someUrl');
    expect(configCtrlObj.current.jsonData.keystoneUrl).to.be.equal('keystoneUrl');
    expect(configCtrlObj.current.jsonData.canPassword).to.be.equal('canp');
    expect(configCtrlObj.current.jsonData.canUsername).to.be.equal('canU');
    expect(configCtrlObj.current.jsonData.canTenant).to.be.equal('canTeen');
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
