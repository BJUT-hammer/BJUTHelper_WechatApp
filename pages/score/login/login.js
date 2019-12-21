var Zan = require('../../../dist/index');

let sendRequest = function(
  id, pwd, year, term,
  success=null, fail=null){
  wx.request({
    url: 'https://chafen.bjut123.com/API.php',
    data: {
      account: id,
      password: pwd,
      current_year: year,
      current_term: term,
    },
    header: {
      'content-type': 'application/json' // 默认值
    },
    success(res) {
      console.log(res.data);
      if (res.data.err && fail){
        fail(res.data);
      }
      else if(success){
        success(res.data.result);
      }
    },
    fail() {
      let err = new Object();
      err.err = 400;
      err.err_msg = "请检查网络";
      fail(err);
    }
  })
}

var app = getApp()

const genYear = (year) => String(year) + "-" + String(year + 1)
const now = new Date();
let thisYear = now.getFullYear()
if (now.getMonth < 9) {
  thisYear -= 1
}
const years = ['请选择学年']
years.push(
  genYear(thisYear),
  genYear(thisYear - 1),
  genYear(thisYear - 2),
  genYear(thisYear - 3),
  genYear(thisYear - 4)
)

Page(Object.assign({}, Zan.Switch,{
  data: {
    user:"",
    pwd:"",
    year: years,
    yearIndex: 0,
    term: ['请选择学期', '1', '2', '3'],
    termIndex: 0,
    rememberMe: {
      checked: false
    },
    showNoticeDialog: false,
    showDeveloperDialog: false,
    disabled: false,
    loading: false,
  },
  onLoad: function () {
    let that = this;
    wx.getStorage({
      key: "user_info",
      success(e) {
        let info = e.data;
        if (info) {
          if (!info.yearIndex) info.yearIndex = 0;
          if (!info.termIndex) info.termIndex = 0;
          that.setData({
            user: info.user,
            pwd: info.pwd,
            yearIndex: info.yearIndex,
            termIndex: info.termIndex,
            rememberMe: {
              checked: true
            }
          });
        }
      }
    });
    wx.cloud.init();
    wx.cloud.callFunction({
      // 云函数名称
      name: 'shareScore',
      // 传给云函数的参数
      data: {
        a: 1,
        b: 2,
      },
      success: function (res) {
        console.log(res.result) // 3
      },
      fail: console.error
    })
  },
  onUserChange: function (e) {
    this.setData({
      user: e.detail.value
    });
  },
  onPwdChange: function (e) {
    this.setData({
      pwd: e.detail.value
    });
  },
  onYearChange: function (e) {
    this.setData({
      yearIndex: e.detail.value
    });
  },
  onTermChange: function (e) {
    this.setData({
      termIndex: e.detail.value
    });
  },
  onShareAppMessage: function(e){
    return {
      title: '野生工大助手 - 外网查分小程序',
      path: '/pages/score/login/login'
    }
  },

  toggleNoticeDialog() {
    this.setData({
      showNoticeDialog: !this.data.showNoticeDialog
    });
  },

  toggleDeveloperDialog() {
    this.setData({
      showDeveloperDialog: !this.data.showDeveloperDialog
    });
  },

  handleZanSwitchChange(e) {
    var componentId = e.componentId;
    var checked = e.checked;

    // 同步开关
    this.setData({
      [`${componentId}.checked`]: checked
    });

    // 同步缓存
    if (checked) {
      this.saveUserStorage();
    }
    else {
      this.clearUserStorage();
    }
  },

  saveUserStorage() {
    wx.setStorage({
      key: "user_info",
      data: {
        user: this.data.user,
        pwd: this.data.pwd,
        yearIndex: this.data.yearIndex,
        termIndex: this.data.termIndex,
      }
    })
  },

  clearUserStorage() {
    wx.setStorage({
      key: "user_info",
      data: null
    })
  },

  startRequireScore(e) {

    // 机房维护提示
    // wx.showToast({
    //   title: '抱歉，学校机房维护，暂时暂停查分服务。',
    //   icon: 'none',
    //   duration: 2000
    // })
    // return;
    // 机房维护提示end

    if (!(
      this.data.user 
      && this.data.pwd
      )){

        wx.showToast({
          title: '还没有输入 学号 或 密码 哦～',
          icon: 'none',
          duration: 2000
        })

        return;

      }

    if (!(
      this.data.yearIndex
      && this.data.termIndex
    )) {

      wx.showToast({
        title: '别忘了选择查询 学年 和 学期 哦～',
        icon: 'none',
        duration: 2000
      })

      return;

    }
    if (this.data.rememberMe.checked) {
      this.saveUserStorage();
    }
    else {
      this.clearUserStorage();
    }

    if (this.data.disable) {

      wx.showToast({
        title: '正在查询中，请稍候...',
        icon: 'none',
        duration: 2000
      })

      return;

    }
    this.setData({
      loading: true,
      disable: true
    });
    let that = this;
    sendRequest(
      this.data.user,
      this.data.pwd,
      this.data.year[this.data.yearIndex],
      this.data.term[this.data.termIndex],
      function(data){
        that.setData({
          loading: false,
          disable: false
        })
        let requestInfo = {
          sid: that.data.user,
          currentYear: that.data.year[that.data.yearIndex],
          currentTerm: that.data.term[that.data.termIndex],
          pwd: that.data.pwd,
        }
        wx.navigateTo({
          url: '../result/result?info=' + JSON.stringify(requestInfo) + '&result=' + JSON.stringify(data),
        });
      },
      function(err){
        that.setData({
          loading: false,
          disable: false
        });
        wx.showToast({
          title: err.err_msg,
          icon: 'none',
          duration: 2000
        })
      }
    );
    
  }
}))
