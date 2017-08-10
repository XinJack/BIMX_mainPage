<template>
  <div id="app">
    <div id="navbar">
      <el-menu theme="dark" mode="horizontal" @select="handleMenuSelect">
        <el-menu-item index = "1">BIMX</el-menu-item>
        <el-submenu index="2">
          <template slot="title">加载模型</template>
          <el-menu-item :key="model.modelId" v-for="(model, index) in models" :index="model.modelId" v-text="model.modelName"></el-menu-item>
        </el-submenu>
        <el-submenu index="3">
          <template slot="title">模型单选操作</template>
          <el-menu-item-group>
            <template slot="title">隐藏</template>
            <el-menu-item index="3-1">隐藏构件</el-menu-item>
            <el-menu-item index="3-2">恢复上一隐藏构件</el-menu-item>
            <el-menu-item index="3-3">恢复所有隐藏构件</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group>
            <template slot="title">半透明</template>
            <el-menu-item index="3-4">半透明构件</el-menu-item>
            <el-menu-item index="3-5">恢复上一半透明构件</el-menu-item>
            <el-menu-item index="3-6">恢复所有半透明构件</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group>
            <template slot="title">其它</template>
            <el-menu-item index="3-7">跳转到选中的构件</el-menu-item>
            <el-menu-item index="3-8">隔离选中的构件</el-menu-item>
            <el-menu-item index="3-9">恢复隔离构件</el-menu-item>
          </el-menu-item-group>
        </el-submenu>
        <el-submenu index="4">
          <template slot="title">模型多选操作</template>
          <el-menu-item-group>
            <template slot="title">启动</template>
            <el-menu-item index="4-1">开始多选操作</el-menu-item>
            <el-menu-item index="4-2">结束多选操作</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group>
            <template slot="title">隐藏</template>
            <el-menu-item index="4-3">隐藏选中构件</el-menu-item>
            <el-menu-item index="4-4">恢复隐藏</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group>
            <template slot="title">半透明</template>
            <el-menu-item index="4-5">半透明选中构件</el-menu-item>
            <el-menu-item index="4-6">恢复半透明</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group>
            <template slot="title">隔离</template>
            <el-menu-item index="4-7">隔离选中构件</el-menu-item>
            <el-menu-item index="4-8">恢复隔离</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group>
            <template slot="title">其它</template>
            <el-menu-item index="4-9">跳转到选中构件</el-menu-item>
            <el-menu-item index="4-10">清除当前选择集</el-menu-item>
          </el-menu-item-group>
        </el-submenu>
        <el-submenu index="5">
            <template slot="title">数据查看</template>
            <el-menu-item index="5-1">查看视频</el-menu-item>
            <el-menu-item index="5-2">查看温度曲线</el-menu-item>
        </el-submenu>
        <el-menu-item index="6">书签管理</el-menu-item>
        <el-menu-item index="7" class="logout">退出登录</el-menu-item>
      </el-menu>
    </div>
    <div id="bimx" ref="bimx"></div>
    <el-dialog v-if="showDialog" :visible.sync="showDialog" :title="dialogTitle" size="large" :before-close='closeDialog'>
        <video-player :options="playerOptions" v-if="playerOptions.sources"></video-player>
        <div id="echartContainer" v-if="!playerOptions.sources && !showBookmarks"></div>
        <div v-if="showNewBookmark">
          <el-form :inline="true">
            <el-form-item label="书签名称">
              <el-input :autofocus="true" placeholder="书签名称" v-model.trim="newBookmarkName"></el-input>
            </el-form-item>
          </el-form>
        </div>
        <div v-if="showBookmarks" slot="footer" class="dialog-footer">
          <el-button type="primary" @click="createNewBookmark" v-if="dialogTitle==='新建书签'">创建</el-button>
          <el-button type="primary" @click="confirmEditBookmark" v-if="dialogTitle==='编辑书签'">确定</el-button>
          <el-button type="danger" @click="closeNewBookmark">取消</el-button>
        </div>
    </el-dialog>
    <div v-show="!attributePaneShown" @click="showAttributePane" class="bf-toolbar" style="position: absolute; right: 250px; top: 70px; z-index: 99;">
        <div class="bf-button gld-bf-properties" title="属性"></div>
    </div>
    <div v-if="selectionPropertyData" v-show="attributePaneShown" class="bf-panel bf-has-title bf-sizable" title="属性" style="width: 300px; height: 600px; min-width: 200px; min-height: 200px; right: 10px; top: 70px;">
        <div class="bf-close" @click="hideAttributePane"></div>
        <div class="bf-title" style="cursor: move; user-select: none;">属性</div>
        <div class="bf-cantainer">
            <table class="bf-table">
                <tbody v-for="property in selectionPropertyData.properties" class="bf-group">
                    <tr class="bf-group-title">
                        <td colspan="2"><i class="bf-icon" @click="toggleProperty"></i>{{property.group}}</td>
                    </tr>
                    <tr v-for="item in property.items" class="bf-group-content">
                        <td class="bf-key">{{item.key}}</td>
                        <td class="bf-value">{{item.unit === null? item.value: item.value + ' ' + item.unit}}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <el-card v-show="showBookmarks" id="bookmarks" class="box-card">
      <div slot="header" class="clearfix">
        <span style="line-height:36px;">{{model.modelName}} - 书签管理</span>
        <div style="float:right;">
          <el-button type="success" @click.native.prevent="createBookmark">新建</el-button>
          <el-button type="primary" @click.native.prevent="saveBookmarks">保存</el-button>
          <el-button type="danger" @click.native.prevent="closeBookmarks">关闭</el-button>
        </div>
      </div>
      <div v-for="(bookmark, index) in bookmarks" style="margin:18px;">
        <span>{{bookmark.bookmarkName}}</span>
        <div style="float:right;">
          <el-button type="success" size="small" @click.native.prevent="viewBookmark(index)">查看</el-button>
          <el-button type="primary" size="small" @click.native.prevent="editBookmark(index)">编辑</el-button>
          <el-button type="danger" size="small" @click.native.prevent="removeBookmark(index)">删除</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';
import _ from 'lodash';
import echarts from 'echarts';

export default {
  data (){
      return {
          models: [], // 当前用户下的所有模型信息
          model: {}, // 当前加载对象
          app: null, // 当前应用对象
          viewer: null, // viewer对象
          selection: null, // 当前选中构件
          selectionPropertyData: null, // 当前选中构件的属性
          hiddenElements: [], // 隐藏的构件列表
          translucentElements: [], //半透明的构件列表
          selectionMode: 'singleSelection', // 选择类型
          multiSelections: [], // 当前多选构件
          multiHiddenElements: [], // 多选隐藏构件列表
          multiTranslucentElements: [], // 多选半透明构件列表
          multiIsolateElements: [], // 多选隔离列表
          playerOptions: {}, // 视频播放选项
          showDialog: false, // 是否显示对话框（用于显示视频，曲线等）
          dialogTitle: '', // 对话框标题
          chart: {}, // 图表对象
          collapseProperty: false, // 是否折叠属性表
          attributePaneShown: true, // 用于控制属性表的显示和隐藏
          bookmarks: [], // 书签（与某个模型相对应）
          newBookmarkName: '', // 新书签的名称
          showBookmarks: false, // 用于控制书签页是否显示
          showNewBookmark: false, // 用于控制创建新书签页表单是否显示
          editBookmarkIndex: -1, // 记录编辑时书签的位置
      }
  },
  created () {
      // 加载模型信息
      axios.get('/api/models')
        .then((response) => {
          var data = response.data;
          if(data.code === 'success'){
              this.models = data.data;
              this.loadModel(this.models[0].modelId);
          }
      });
  },
  watch: {
    selection (newVal, oldVal) { // 监听选中的构件，如果发生变化，属性表的内容也相应的改变
        if(newVal !== null) {
            this.dataManager.getComponentProperty(newVal, (propertyData) => {
                this.selectionPropertyData = propertyData;
                this.attributePaneShown = true;
            });
        }else {
            this.selectionPropertyData = {};
            this.attributePaneShown = false;
        }
    },
    // 加载的模型发生改变时向后台请求新的书签数据（书签数据是与模型挂钩的）
    model (newVal, oldVal) {
      axios.get('/api/bookmarks', {
        params: {
          modelId: newVal.modelId
        }
      }).then((res) => {
        res = res.data;
        if(res.code === 'success') this.bookmarks = res.data;
        else this.bookmarks = [];
      }).catch((err) => {
        console.log(err);
        this.bookmarks = [];
      });
    }
  },
  methods: {
        // navbar点击处理
        handleMenuSelect (key, keyPath) {
            var self = this;
            if(keyPath[0] === '2'){ // 加载模型
                var modelId = key;
                this.loadModel(modelId);
                return;
            }
            if(key === '6') { // 书签管理
              this.showBookmarks = true;
              return;
            }
            if(key === '7') { // 登出
                this.logout();
                return;
            }
            if(keyPath[0] === '3' && this.selectionMode === 'multiSelection'){
                this.$alert('请先退出多选操作', '操作错误', {
                    confirmButtonText: '我知道了'
                });
                return;
            }
            if(keyPath[0] === '4' && key !== '4-1' && this.selectionMode === 'singleSelection'){
                this.$alert('请先启动多选操作', '操作错误', {
                    confirmButtonText: '我知道了'
                });
                return;
            }
            if(this.viewer === null){
                this.$alert('请先加载模型', '操作错误', {
                    confirmButtonText: '我知道了'
                });
                return;
            }
            switch(key){
                case '3-1':
                    this.hideSelection();
                    break;
                case '3-2':
                    this.showLastHidden();
                    break;
                case '3-3':
                    this.showAllHidden();
                    break;
                case '3-4':
                    this.translucentSelection();
                    break;
                case '3-5':
                    this.showLastTranslucent();
                    break;
                case '3-6':
                    this.showAllTranslucent();
                    break;
                case '3-7':
                    this.zoomToSelectedComponents();
                    break;
                case '3-8':
                    this.isolateSelection();
                    break;
                case '3-9':
                    this.clearIsolation();
                    break;
                case '4-1':
                    this.clearSelections();
                    this.selectionMode = 'multiSelection';
                    break;
                case '4-2':
                    this.clearSelections();
                    this.hideAttributePane();
                    this.selectionMode = 'singleSelection';
                    break;
                case '4-3':
                    this.hideMultiSelection();
                    break;
                case '4-4':
                    this.showMultiSelection();
                    break;
                case '4-5':
                    this.translucentMultiSelection();
                    break;
                case '4-6':
                    this.showTranslucentMultiSelection();
                    break;
                case '4-7':
                  this.isolateMultiSelection();
                  break;
                case '4-8':
                  this.showIsolateMultiSelection();
                  break;
                case '4-9':
                  this._addSelection();
                  this.viewer.highlightComponentsById(undefined, 'Red', 'red');
                  this.viewer.setSelectedComponentsById(this.multiSelections);
                  this.zoomToSelectedComponents();
                  this.viewer.render();
                  break;
                case '4-10':
                  this.hideAttributePane();
                  this.clearSelections();
                  break;
                case '5-1':
                    this.playVideo();
                    break;
                case '5-2':
                    this.showTemperatureChart();
                    break;
            }
        },
        // 退出登录
        logout () {
            axios.get('/logout')
              .then((response) => {
                console.log(response.data);
              });
            window.location.href = '/login';
        },
        // 重置变量
        reset() {
            this.app = null;
            this.viewer = null;
            this.selection = null;
            this.hiddenElements = [];
            this.translucentElements = [];
            this.selectionMode = 'singleSelection';
            this.multiSelections = [];
            this.multiHiddenElements = [];
            this.multiTranslucentElements = [];
            this.multiIsolateElements = [];
            this.showBookmarks = false;
        },
        // 加载模型
        loadModel (modelId) {
            this.reset();
            var model = this.models[_.findIndex(this.models, {'modelId': modelId})];
            if(this.model === model) {
                return;
            }
            this.model = model;
            axios.get('/api/viewToken', {
                params: {
                    modelId: this.model.modelId,
                    modelType: this.model.modelType
                }
            }).then((response) => {
                this.viewToken = response.data.data;
                this.$refs.bimx.innerHTML = '';
                var bimfaceLoaderConfig = new BimfaceSDKLoaderConfig();
                bimfaceLoaderConfig.viewToken = this.viewToken;
                bimfaceLoaderConfig.configuration = BimfaceConfigrationOption.Debug;
                BimfaceSDKLoader.load(bimfaceLoaderConfig, this.onSDKLoadSucceeded, this.onSDKLoadFailed);
            }).catch((err) => {
                console.log(err);
                this.$message({
                    message: '加载模型失败: 无法获取viweToken',
                    type: 'error'
                });
            })
        },
        onSDKLoadSucceeded (viewMetaData) {
            var webAppConfig = Glodon.Bimface.Application.WebApplication3DConfig();
            webAppConfig.domElement = this.$refs.bimx;
            this.app = new Glodon.Bimface.Application.WebApplication3D(webAppConfig);
            this.app.addView(this.viewToken);
            this.viewer = this.app.getViewer();

            var dataManagerConfig = new Glodon.Bimface.Data.MetaDataManagerConfig();
            dataManagerConfig.viewToken = viewMetaData.viewToken;
            dataManagerConfig.modelId = this.model.modelId;
            dataManagerConfig.modelType = this.model.modelType === 'normal'? 'singleModel': 'integrateModel';
            this.dataManager = new Glodon.Bimface.Data.MetaDataManager(dataManagerConfig);

            var appEvents = Glodon.Bimface.Application.WebApplication3DEvent;

            // 视图加载完毕后事件
            this.app.addEventListener(appEvents.ViewAdded, () => {
                this.viewer.setView('Home'); // 加载完模型后设置视图为Home视图
                this.viewer.render();
            });

            // 鼠标点击事件
            this.app.addEventListener(appEvents.ComponentsSelectionChanged, (data) => {
                if(!data.objectId){ // 未选中构件
                    // 多选
                    if(this.selectionMode === 'multiSelection'){ // 保证未选中构件时之前选中的构件也不会消失
                        if(this.selection !== null) { // 上一选择不为空
                            this.multiSelections.push(this.selection);
                        }
                        this.viewer.highlightComponentsById(undefined, 'Red', 'red');
                        this.viewer.setSelectedComponentsById(this.multiSelections);
                    }
                    this.selection = null; // 将当前选择设置为空
                    this.viewer.render();
                    return;
                }

                // 处理单选和多选
                if(this.selectionMode === 'singleSelection'){ // 单选
                    this.selection = data.objectId;
                }else if(this.selectionMode === 'multiSelection'){ // 多选

                    var index = _.indexOf(this.multiSelections, data.objectId);
                    if(this.selection === null) { // 上一选择为空
                        if(index === -1) { // 选中新构件
                            this.selection = data.objectId;
                        } else { // 选中之前选中的构件
                            this.multiSelections.splice(index, 1);
                            if(this.multiSelections.length > 0) {
                                this.selection = this.multiSelections.splice(this.multiSelections.length - 1, 1)[0];
                            }
                        }
                    }else { // 上一选择不为空
                        // 选中新构件
                        if(index === -1 && this.selection !== data.objectId) {
                            this.multiSelections.push(this.selection);
                            this.selection = data.objectId;
                        }else if(index !== -1) { // 选中很久之前选中的构件
                            this.multiSelections.splice(index, 1);
                        }else if(this.selection === data.objectId) { // 选中上一次选中的构件
                            console.log('last select');
                            if(this.multiSelections.length > 0) {
                                this.selection = this.multiSelections.splice(this.multiSelections.length - 1, 1)[0];
                            }else {
                                this.selection = null;
                            }
                        }
                    }
                    // 这里并不是重复代码，很重要，保证之前高亮的构件会先清除，不然会出现多个构件高亮的bug
                    this.viewer.highlightComponentsById(undefined, 'Red', 'red');
                    if (this.selection !== null) {
                        this.viewer.highlightComponentsById([this.selection], 'Red', 'red');
                    }else {
                        this.viewer.highlightComponentsById(undefined, 'Red', 'red');
                    }
                    this.viewer.setSelectedComponentsById(this.multiSelections);
                    this.viewer.render();
                }
            });

            // 去除广联达about按钮
            var informationButton = document.getElementsByClassName('gld-bf-information')[0];
            informationButton.parentNode.removeChild(informationButton);
            // 去除广联达properties按钮
            var propertyButton = document.getElementsByClassName('gld-bf-properties')[0];
            propertyButton.parentNode.removeChild(propertyButton);
        },
        onSDKLoadFailed (err) {
            console.log(err);
            this.$alert('无法加载模型', '加载模型失败', {
                confirmButtonText: '我知道了'
            });
        },
        // 跳转到选择的构件
        zoomToSelectedComponents () {
            this.viewer.zoomToSelectedComponents();
        },
        // 隐藏当前选择构件
        hideSelection () {
            if(this.selection === null){
                return;
            }
            this.viewer.hideComponents([this.selection]);
            this.hiddenElements.push(this.selection);
            this.clearSelections();
            this.hideAttributePane();
            this.viewer.render();
        },
        // 显示上一隐藏构件
        showLastHidden () {
            if(this.hiddenElements.length > 0){
                var objectId = this.hiddenElements.pop();
                this.viewer.showComponents([objectId]);
                this.viewer.render();
            }
        },
        // 显示所有隐藏构件
        showAllHidden () {
            if(this.hiddenElements.length > 0){
                this.viewer.showComponents(this.hiddenElements);
                this.viewer.render();
                this.hiddenElements = [];
            }
        },
        // 半透明当前选择构件
        translucentSelection () {
            if(this.selection === null){
              return;
            }
            this.viewer.setComponentsOpacity([this.selection], 'Translucent');
            this.translucentElements.push(this.selection);
            this.hideAttributePane();
            this.clearSelections();
            this.viewer.render();
        },
        // 显示上一半透明构件
        showLastTranslucent () {
            if(this.translucentElements.length > 0){
                var objectId = this.translucentElements.pop();
                this.viewer.setComponentsOpacity([objectId], 'Opaque');
                this.viewer.render();
            }
        },
        // 显示所有半透明构件
        showAllTranslucent () {
            if(this.translucentElements.length > 0){
                this.viewer.setComponentsOpacity(this.translucentElements, 'Opaque');
                this.viewer.render();
                this.translucentElements = [];
            }
        },
        // 隔离当前选择构件
        isolateSelection () {
            if(this.selection === null){
              return;
            }
            this.viewer.isolateComponentsById([this.selection], 'MakeOthersTranslucent');
            this.hideAttributePane();
            this.clearSelections();
            this.viewer.render();
        },
        // 显示隔离构件
        clearIsolation () {
            this.viewer.clearIsolation();
            this.viewer.render();
        },
        _addSelection () { // 在多选状态下将当前选择加入到所有选择集中
            if(this.selection !== null) {
                this.multiSelections.push(this.selection);
                this.selection = null;
            }
        },
        // 隐藏多选构件
        hideMultiSelection () {
            this._addSelection();
            if(this.multiSelections.length >= 0){
                this.multiSelections.forEach((objectId) => {
                    this.multiHiddenElements.push(objectId);
                });
                this.clearSelections();
                this.viewer.hideComponents(this.multiHiddenElements);
                this.viewer.render();
            }
        },
        // 显示多选构件
        showMultiSelection () {
            this.viewer.showComponents(this.multiHiddenElements);
            this.multiHiddenElements = [];
            this.clearSelections();
            this.viewer.render();
        },
        // 半透明多选构件
        translucentMultiSelection () {
            this._addSelection();
            if(this.multiSelections.length >= 0){
                this.multiSelections.forEach((objectId) => {
                  this.multiTranslucentElements.push(objectId);
                });
                this.clearSelections();
                this.viewer.setComponentsOpacity(this.multiTranslucentElements, 'Translucent');
                this.hideAttributePane();
                this.viewer.render();
            }
        },
        // 显示半透明多选构件
        showTranslucentMultiSelection () {
            this.viewer.setComponentsOpacity(this.multiTranslucentElements, 'Opaque');
            this.multiTranslucentElements = [];
            this.clearSelections();
            this.viewer.render();
        },
        // 隔离多选构件
        isolateMultiSelection () {
            this._addSelection();
            if(this.multiSelections.length > 0){
                this.multiSelections.forEach((objectId) => {
                  this.multiIsolateElements.push(objectId);
                });
                this.clearSelections();
                this.viewer.isolateComponentsById(this.multiIsolateElements, 'MakeOthersTranslucent');
                this.hideAttributePane();
                this.viewer.render();
            }
        },
        // 显示隔离构件
        showIsolateMultiSelection () {
            this.viewer.clearIsolation();
            this.multiIsolateElements = [];
            this.clearSelections();
            this.viewer.render();
        },
        // 隐藏属性窗口
        hideAttributePane () {
            this.attributePaneShown = false;
        },
        // 显示属性窗口
        showAttributePane() {
            this.attributePaneShown = true;
        },
        // 清除当前选择集
        clearSelections () {
            // 清除单选和多选数据
            this.selection = null;
            this.multiSelections = [];
            if(this.viewer){
                // 要清除高亮，将ids设置为undefined即可
                this.viewer.highlightComponentsById(undefined, 'Red', 'red');
                this.viewer.setSelectedComponentsById([]);
                this.viewer.render();
            }
        },
        // 播放视频
        playVideo () {
            var self = this;
            if (this.selection === null) { // 未选中构件
                this.$message({
                    message:'请选择想要查看视频的摄像头'
                });
            }else{ // 尝试从服务器获取视频播放选项
                var modelId = this.model.modelId;
                var objectId = this.selection;
                if(!/(摄像头|camera)/i.test(this.selectionPropertyData.name)){
                    self.$message({
                        message:'当前选择不是摄像头！',
                        type: 'warning'
                    });
                    return;
                }
                axios.get('/api/video', {
                    params: {
                        'modelId': modelId,
                        'objectId': objectId
                    }
                }).then(function(response){
                    var options = response.data.data;
                    if(!options.sources) {
                        self.$message({
                            message:'请选择想要查看视频的摄像头'
                        });
                    }else{
                        self.showDialog = true;
                        self.dialogTitle = '现场视频';
                        self.playerOptions = options;
                    }
                }).catch(function(err){
                    console.log(err);
                    self.$message({
                         message:'服务器错误，请稍后再试'
                    });
                });
            }
        },
        //显示温度曲线
        showTemperatureChart () {
            if (this.selection === null) { // 未选中构件
                this.$message({
                    message:'请选择想要查看温度曲线的温度传感器'
                });
            }else{
                var modelId = this.model.modelId;
                var objectId = this.selection;
                axios.get('/api/data', {
                    params: {
                        'modelId': modelId,
                        'objectId': objectId,
                        'type': 'temperature'
                    }
                }).then((response) => {
                    var option = response.data.data;
                    if(!option.series){
                        this.$message({
                            message: '请选择温度传感器',
                            type: 'warning'
                        });
                    }else{
                        this.showDialog = true;
                        this.dialogTitle = '温度传感器数据';
                        this.$nextTick(() => { // 保证echarts绘图的dom存在
                            this.chart = echarts.init(document.getElementById('echartContainer'));
                            this.chart.setOption(option);
                        });
                    }
                }).catch((err) => {
                    console.log(err);
                    self.$message({
                         message:'服务器错误，请稍后再试'
                    });
                });
            }
        },
        // 关闭对话框窗口
        closeDialog () {
            this.showDialog = false;
            this.dialogTitle = '';
            this.showNewBookmark = false;
            this.newBookmarkName = '';
            this.playerOptions = {};
            if(this.chart.id) { // 确保关闭chart之前chart存在
                this.chart.dispose();
            }
        },
        // 切换属性表的属性折叠状态
        toggleProperty (e) {
            // 获取该i标签所在的tbody节点
            var tbodyNode = e.target.parentNode.parentNode.parentNode;
            // 切换tbody节点的class
            if(tbodyNode.className.indexOf('bf-collapse') >= 0){
                tbodyNode.className = 'bf-group';
            }else {
                tbodyNode.className = 'bf-group bf-collapse';
            }
        },
        // 新建书签
        createBookmark () {
          this.showDialog = true;
          this.dialogTitle = "新建书签";
          this.showNewBookmark = true;
        },
        // 关闭书签页
        closeBookmarks () {
          this.showBookmarks = false;
        },
        // 取消创建新书签 => 实际就是关闭
        closeNewBookmark () {
          this.showDialog = false;
          this.showNewBookmark = false;
          this.newBookmarkName = '';
        },
        // 创建新书签
        createNewBookmark () {
          if(this.newBookmarkName === ''){
            this.$message({
              type: 'warning',
              message: '书签名称不能为空'
            });
          } else{
            this.bookmarks.push({
              bookmarkName: this.newBookmarkName,
              cameraStatus: this.viewer.getCameraStatus()
            });
            this.closeNewBookmark();
          }
        },
        // 确定编辑书签
        confirmEditBookmark () {
          if(this.newBookmarkName === ''){
            this.$message({
              type: 'warning',
              message: '书签名称不能为空'
            });
          } else{
            var bookmark = this.bookmarks[this.editBookmarkIndex];
            this.bookmarks[this.editBookmarkIndex] = {
              bookmarkName: this.newBookmarkName,
              cameraStatus: bookmark.cameraStatus
            };
            this.closeNewBookmark();
            this.editBookmarkIndex = -1;
          }
        },
        // 查看某一书签
        viewBookmark (index) {
          var cameraStatus = this.bookmarks[index].cameraStatus;
          this.viewer.setCameraStatus(cameraStatus);
          this.showBookmarks = false;
        },
        // 编辑某一书签
        editBookmark (index) {
          var bookmark = this.bookmarks[index];
          this.showDialog = true;
          this.dialogTitle = '编辑书签';
          this.showNewBookmark = true;
          this.newBookmarkName = bookmark.bookmarkName;
          this.editBookmarkIndex = index;
        },
        // 删除某一书签
        removeBookmark (index) {
          this.bookmarks.splice(index, 1);
        }, 
        // 保存书签
        saveBookmarks () {
          axios.put('/api/bookmarks', {
            modelId: this.model.modelId,
            bookmarks: this.bookmarks
          }).then((res) => {
            res = res.data;
            if(res.code === 'success') {
              this.$message({
                type: 'success',
                message: '保存书签成功'
              });
              this.closeBookmarks();
            }else{
              this.$message({
                type: 'warning',
                message: '同步书签失败，请稍后重试'
              });
            }
          }).catch((err) => {
            console.log(err);
            this.$message({
              type: 'warning',
              message: '同步书签失败，请稍后重试'
            });
          })
        }
    }
};
</script>

<style lang="stylus" rel="stylesheet/stylus">
body
  padding: 0
  margin: 0
  .el-message
    margin-top: 80px
#app
  #navbar
    margin: 0px
    ul.el-menu
      li.logout
        position: fixed
        right: 0px
    div.el-tabs
      height: 100%
  #bimx
    position: fixed
    left: 0px
    right: 0px
    top: 60px
    bottom: 0px
  #echartContainer
    margin: 20px auto
    width: 600px
    height: 600px
  #bookmarks
    position: absolute
    left: 10px
    top: 70px
    width: 500px
    z-index: 99
    display: block
    max-height: 500px
    overflow-y: auto
</style>
