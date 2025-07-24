const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 加载分类数据
const categoriesPath = path.join(__dirname, 'public', 'categories.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

// 创建索引对象
const index = {
  categories: {},
  sentences: {}
};

console.log(chalk.blue('开始构建一言索引...'));
console.log(chalk.cyan(`找到 ${categories.length} 个分类`));

// 处理每个分类
categories.forEach(category => {
  const sentencesPath = path.join(__dirname, 'public', category.path);
  
  if (!fs.existsSync(sentencesPath)) {
    console.log(chalk.yellow(`警告: ${category.path} 文件不存在`));
    return;
  }
  
  try {
    const sentences = JSON.parse(fs.readFileSync(sentencesPath, 'utf8'));
    
    // 添加分类信息
    index.categories[category.key] = {
      name: category.name,
      desc: category.desc,
      count: sentences.length
    };
    
    // 添加句子到索引
    sentences.forEach((sentence, idx) => {
      index.sentences[sentence.id] = {
        category: category.key,
        position: idx,
        length: sentence.hitokoto.length
      };
    });
    
    console.log(chalk.green(`√ 处理 ${category.key}: ${category.name} (${sentences.length} 条句子)`));
  } catch (e) {
    console.log(chalk.red(`错误: 处理 ${category.key}.json 失败 - ${e.message}`));
  }
});

// 保存索引文件
const indexPath = path.join(__dirname, 'public', 'sentences', 'index.json');
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

console.log(chalk.blue.bold(`\n索引构建完成!`));
console.log(chalk.cyan(`索引文件已保存至: ${indexPath}`));
console.log(chalk.cyan(`总句子数: ${Object.keys(index.sentences).length}`));