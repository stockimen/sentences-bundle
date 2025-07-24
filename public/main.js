// 修复分类加载问题
document.addEventListener('DOMContentLoaded', async function() {
  // 获取所有必要的DOM元素
  const hitokotoText = document.getElementById('hitokoto-text');
  const hitokotoInfo = document.getElementById('hitokoto-info');
  const hitokotoMeta = document.getElementById('hitokoto-meta');
  const minLengthInput = document.getElementById('min-length');
  const maxLengthInput = document.getElementById('max-length');
  const minLengthDisplay = document.getElementById('min-length-display');
  const maxLengthDisplay = document.getElementById('max-length-display');
  const encodeTypeSelect = document.getElementById('encode-type');
  const charsetSelect = document.getElementById('charset');
  const callbackInput = document.getElementById('callback');
  const selectorInput = document.getElementById('selector');
  const sortSelect = document.getElementById('sort');
  const getHitokotoBtn = document.getElementById('get-hitokoto');
  const getRandom = document.getElementById('get-random');
  const apiResponse = document.getElementById('api-response');
  const urlDisplay = document.getElementById('url-display');
  const buttonIcon = document.getElementById('button-icon');
  const buttonText = document.getElementById('button-text');
  const jsParamsSection = document.getElementById('js-params');
  
  // 加载分类数据
  let categories = [];
  try {
    const response = await fetch('/categories.json');
    categories = await response.json();
    renderCategories(categories);
    
    // 更新统计信息
    document.getElementById('stat-categories').textContent = categories.length;
  } catch (e) {
    console.error('加载分类失败:', e);
    // 使用硬编码的分类数据作为备选方案
    categories = [
      {id: 1, name: "动画", key: "a", desc: "Anime - 动画"},
      {id: 2, name: "漫画", key: "b", desc: "Comic - 漫画"},
      {id: 3, name: "游戏", key: "c", desc: "Game - 游戏"},
      {id: 4, name: "文学", key: "d", desc: "Literature - 文学"},
      {id: 5, name: "原创", key: "e", desc: "Original - 原创"},
      {id: 6, name: "网络", key: "f", desc: "Internet - 来自网络"},
      {id: 7, name: "其他", key: "g", desc: "Other - 其他"},
      {id: 8, name: "影视", key: "h", desc: "Video - 影视"},
      {id: 9, name: "诗词", key: "i", desc: "Poem - 诗词"},
      {id: 10, name: "网易云", key: "j", desc: "NCM - 网易云"},
      {id: 11, name: "哲学", key: "k", desc: "Philosophy - 哲学"},
      {id: 12, name: "抖机灵", key: "l", desc: "Funny - 抖机灵"}
    ];
    renderCategories(categories);
    document.getElementById('stat-categories').textContent = categories.length;
    
    const categoryList = document.getElementById('category-list');
    categoryList.insertAdjacentHTML('afterend', '<div class="warning">网络数据加载失败，使用本地分类数据</div>');
  }
  
  // 事件监听器
  minLengthInput.addEventListener('input', updateLengthDisplay);
  maxLengthInput.addEventListener('input', updateLengthDisplay);
  getHitokotoBtn.addEventListener('click', fetchHitokoto);
  getRandom.addEventListener('click',fetchHitokoto);
  encodeTypeSelect.addEventListener('change', toggleJsParams);
  
  // 初始更新长度显示
  updateLengthDisplay();
  toggleJsParams();
  fetchRandomHitokoto();
  
  // 渲染分类
  function renderCategories(categories) {
    const categoryList = document.getElementById('category-list');
    categoryList.innerHTML = ''; // 清空容器
    
    categories.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      categoryItem.dataset.key = category.key;
      categoryItem.title = category.desc;
      
      // 创建带图标的分类项
      categoryItem.innerHTML = `
        <i class="fas fa-${getCategoryIcon(category.key)}"></i>
        ${category.name}
      `;
      
      categoryItem.addEventListener('click', () => {
        categoryItem.classList.toggle('selected');
      });
      
      categoryList.appendChild(categoryItem);
    });
  }
  
  // 获取分类图标
  function getCategoryIcon(categoryKey) {
    const icons = {
      a: 'film',       // 动画
      b: 'book',       // 漫画
      c: 'gamepad',    // 游戏
      d: 'book-open',  // 文学
      e: 'star',       // 原创
      f: 'globe',      // 网络
      g: 'question',   // 其他
      h: 'tv',         // 影视
      i: 'poem',       // 诗词 (使用font-awesome图标)
      j: 'music',      // 网易云
      k: 'brain',      // 哲学
      l: 'laugh'       // 抖机灵
    };
    return icons[categoryKey] || 'tag';
  }
  
  // 更新长度显示
  function updateLengthDisplay() {
    minLengthDisplay.textContent = minLengthInput.value;
    maxLengthDisplay.textContent = maxLengthInput.value;
  }
  
  // 切换JS参数显示
  function toggleJsParams() {
    if (encodeTypeSelect.value === 'js') {
      jsParamsSection.style.display = 'flex';
      // 添加警告信息
      if (charsetSelect.value === 'gbk') {
        apiResponse.innerHTML = `<span class="warning">警告：GBK编码不支持异步函数！</span>`;
      }
    } else {
      jsParamsSection.style.display = 'none';
    }
  }
  
  // 获取选中的分类
  function getSelectedCategories() {
    const categoryList = document.getElementById('category-list');
    const selected = Array.from(categoryList.querySelectorAll('.selected'));
    return selected.map(item => item.dataset.key);
  }    
  
  // 获取一言
  async function fetchHitokoto() {
    // 显示加载状态
    buttonIcon.innerHTML = '<div class="loading"></div>';
    buttonText.textContent = '获取中...';
    getHitokotoBtn.disabled = true;
    
    // 获取参数
    const selectedCategories = getSelectedCategories();
    const minLength = minLengthInput.value;
    const maxLength = maxLengthInput.value;
    const encodeType = encodeTypeSelect.value;
    const charset = charsetSelect.value;
    const callback = callbackInput.value;
    const selector = selectorInput.value;
    const sort = sortSelect.value;
    
    // 构建API URL
    const url = new URL('./api/hitokoto', window.location.origin);
    selectedCategories.forEach(c => url.searchParams.append('c', c));
    url.searchParams.set('min_length', minLength);
    url.searchParams.set('max_length', maxLength);
    url.searchParams.set('encode', encodeType);
    url.searchParams.set('charset', charset);
    url.searchParams.set('sort', sort);
    
    if (callback) url.searchParams.set('callback', callback);
    if (selector) url.searchParams.set('selector', selector);
    
    // 显示URL
    urlDisplay.textContent = url.toString();
    
    try {
      // 发送请求
      const response = await fetch(url);
      
      // 根据返回类型处理响应
      if (encodeType === 'text') {
        const text = await response.text();
        hitokotoText.textContent = text;
        hitokotoInfo.textContent = '';
        hitokotoMeta.innerHTML = '';
        
        // 显示原始响应
        apiResponse.textContent = text;
        apiResponse.classList.add('success');
      } else {
        const data = await response.json();
        
        // 显示一言
        if (data.status === 200 && data.data.length > 0) {
          const hitokoto = data.data[0];
          hitokotoText.textContent = hitokoto.hitokoto;
          
          // 构建来源信息
          let fromInfo = '';
          if (hitokoto.from) {
            fromInfo = hitokoto.from;
            if (hitokoto.from_who) {
              fromInfo += ` · ${hitokoto.from_who}`;
            }
          } else if (hitokoto.from_who) {
            fromInfo = hitokoto.from_who;
          }
          hitokotoInfo.textContent = fromInfo;
          
          // 构建元数据
          const category = categories.find(c => c.key === hitokoto.type) || {};
          hitokotoMeta.innerHTML = `
            <span><i class="fas fa-tag"></i> ${category.name || hitokoto.type}</span>
            <span><i class="fas fa-hashtag"></i> ${hitokoto.id}</span>
            <span><i class="fas fa-ruler"></i> ${hitokoto.length}字</span>
            <span><i class="fas fa-calendar"></i> ${formatDate(hitokoto.created_at)}</span>
          `;
          
          // 显示JSON响应
          apiResponse.textContent = JSON.stringify(data, null, 2);
          apiResponse.classList.add('success');
          
          // 更新统计数据
          updateStatistics(data);
        } else {
          hitokotoText.textContent = '未找到匹配的句子';
          hitokotoInfo.textContent = '请尝试其他筛选条件';
          hitokotoMeta.innerHTML = '';
          
          // 显示错误
          apiResponse.textContent = JSON.stringify(data, null, 2);
          apiResponse.classList.add('error');
        }
      }
    } catch (error) {
      // 错误处理
      hitokotoText.textContent = '获取失败';
      hitokotoInfo.textContent = error.message;
      hitokotoMeta.innerHTML = '';
      
      apiResponse.textContent = `错误: ${error.message}`;
      apiResponse.classList.add('error');
    } finally {
      // 恢复按钮状态
      buttonIcon.innerHTML = '<i class="fas fa-magic"></i>';
      buttonText.textContent = '获取一言';
      getHitokotoBtn.disabled = false;
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  // 随机获取一言
  async function fetchRandomHitokoto() {
    const randomHitokoto = document.getElementById('Random-hitokoto');
    const url = "./api/hitokoto?encode=text";

    try {
      // 发送请求
      const response = await fetch(url);
      
      // 根据返回类型处理响应
      const text = await response.text();
      console.log(text);
      randomHitokoto.textContent = text;  
    } catch (error) {
      console.log(`错误: ${error.message}`);
    } finally {
    }

  }
  
  // 格式化日期
  function formatDate(timestamp) {
    if (!timestamp) return '未知';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  }
  
  // 更新统计数据
  function updateStatistics(data) {
    if (data.stats) {
      document.getElementById('stat-sentences').textContent = data.stats.total || 0;
      document.getElementById('stat-avg-length').textContent = data.stats.avgLength || 0;
    }
  }
});

