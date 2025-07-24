export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const params = url.searchParams;
  
  try {
    // 解析请求参数
    const encodeType = params.get('encode') || 'json';
    const minLength = parseInt(params.get('min_length') || '0');
    const maxLength = parseInt(params.get('max_length') || '999');
    
    // 关键修复：解析环境变量为JSON对象
    let index;
    try {
      // INDEX环境变量是字符串，需要解析为JSON对象
      index = JSON.parse(env.INDEX);
      
      if (!index || !index.categories || !index.sentences) {
        throw new Error("解析后的索引对象结构不完整");
      }
    } catch (parseError) {
      throw new Error(`解析索引JSON失败: ${parseError.message}`);
    }
    
    // 获取可用分类
    const availableCategories = Object.keys(index.categories);
    const categoriesParam = params.getAll('c').length 
      ? params.getAll('c').filter(c => c.length === 1 && availableCategories.includes(c)) 
      : availableCategories;
    
    // 更严格的错误检查
    if (!availableCategories || availableCategories.length === 0) {
      throw new Error("索引中没有有效的分类数据");
    }
    
    // 获取所有符合条件的句子ID
    const candidateIds = Object.keys(index.sentences).filter(id => {
      const sentence = index.sentences[id];
      
      // 检查每个句子的有效性
      if (!sentence || !sentence.category || !sentence.position) {
        console.warn(`跳过无效句子条目: ${id}`);
        return false;
      }
      
      // 检查长度有效性
      const sentenceLength = sentence.length || 0;
      const isValidLength = sentenceLength >= minLength && sentenceLength <= maxLength;
      
      return categoriesParam.includes(sentence.category) && isValidLength;
    });
    
    // 检查是否有可用句子
    if (candidateIds.length === 0) {
      return new Response(JSON.stringify({
        status: 404,
        message: '没有找到符合条件的句子',
        data: [],
        ts: Date.now()
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 随机选择一个句子ID
    const randomId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
    const sentenceInfo = index.sentences[randomId];
    
    if (!sentenceInfo) {
      throw new Error(`随机选择失败: 未找到ID为${randomId}的句子信息`);
    }
    
    // 加载具体分类文件
    const categoryResponse = await context.env.ASSETS.fetch(
      new URL(`/sentences/${sentenceInfo.category}.json`, url)
    );
    
    if (!categoryResponse.ok) {
      throw new Error(`无法加载${sentenceInfo.category}.json文件`);
    }
    
    const categoryData = await categoryResponse.json();
    
    if (!categoryData[sentenceInfo.position]) {
      throw new Error(`在${sentenceInfo.category}.json中找不到位置${sentenceInfo.position}的句子`);
    }
    
    const selectedSentence = categoryData[sentenceInfo.position];
    
    // 返回响应
    return formatResponse(selectedSentence, encodeType);
    
  } catch (error) {
    return new Response(JSON.stringify({
      status: 500,
      message: `服务器错误: ${error.message}`,
      debug: {
        // 提供有用的调试信息
        errorStack: error.stack?.split('\n')?.slice(0, 3) || [],
        environmentVarType: typeof env.INDEX,
        environmentVarLength: env.INDEX?.length || 0,
        environmentVarPreview: env.INDEX?.substring(0, 50) + '...' || 'undefined'
      },
      ts: Date.now()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}


function formatResponse(sentence, encodeType) {
  const baseResponse = {
    status: 200,
    message: 'ok.',
    data: [sentence],
    ts: Date.now()
  };

  switch (encodeType.toLowerCase()) {
    case 'text':
      return new Response(sentence.hitokoto, {
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    default: // JSON响应
      return new Response(JSON.stringify(baseResponse), {
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
  }
}