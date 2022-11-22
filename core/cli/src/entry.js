module.exports = core

const path = require('path')
const semver = require('semver')
const colors = require('colors')
const commander = require('commander')
const program = new commander.Command()
// 判断目录是否存在
const pathExists = require('path-exists').sync
// 拿到 package.json
const constant = require('./const')
const pkg = require('../package.json')

const log = require('@suanlafen/log')
const exec = require('@suanlafen/exec')

// 用户主目录
const userHome = require('user-home')
process.env.CLI_USER_HOME = userHome

async function core () {
  try {
    // 准备工作
    await prepare()
    // 注册命令
    registerCommand()
  } catch (e) {
    log.error(e.message)
    if (process.env.LOG_LEVEL === 'verbose') {
      console.log(e)
    }
  }
}

function registerCommand () {
  // 拿到注册的全局指令
  const opts = program.opts()

  // 注册全局指令
  program
      .name(Object.keys(pkg.bin)[0]) // 脚手架名称
      .usage('<command> [options]') // 命令提示
      .version(pkg.version) // 版本号
      .option('-d, --debug', '调试模式', false)
      .option('-tp, --targetPath <targetPath>', '指定调试文件路径', '')

  program
      .command('init [projectName]')
      .option('-f --force', '强制初始化项目')
      .action(exec)

  // 检查 debug 参数
  program.on('option:debug', () => {
    if (opts.debug) {
      process.env.LOG_LEVEL = 'verbose'
    } else {
      process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
  })

  program.on('option:targetPath', () => {
    process.env.CLI_TARGET_PATH = opts.targetPath
  })

  // 处理命令监听
  program.on('command:*', (params) => {
    const availableCommands = program.commands.map((cmd) => cmd.name())
    console.log(colors.yellow('未知命令:'), colors.red(params[0]))
    if (availableCommands.length > 0) {
      console.log(colors.yellow('可用指令:'), availableCommands.join(', '))
    }
  })

  // 解析命令行参数
  program.parse(process.argv)

  // 如果输入像 slf -d 这样的指令也打印帮助文档
  if (program.args && program.args.length < 1) {
    program.outputHelp()
  }
}

// 准备阶段
async function prepare () {
  // 检查脚手架的版本
  checkPkgVersion() // 检查 包 版本
  checkRoot() // root 用户需要降级处理
  checkUserHome() // 检查用户主目录是否存在
  checkEnv() // 检查环境变量
  await checkGlobalUpdate() // 检查全局更新
}

// 检查全局更新
async function checkGlobalUpdate () {
  // 1 获取当前版本号和模块名
  const currentVersion = pkg.version
  const npmName = pkg.name
  // 2 提取所有版本号，比对有哪些版本号是大于当前版本号
  const {getNpmSemverVersions} = require('@suanlafen/get-npm-info')
  const newestVersion = await getNpmSemverVersions(npmName, currentVersion)
  // 3 获取最新版本号，提示用户更新版本
  if (semver.gt(newestVersion, currentVersion)) {
    log.warn(
        colors.yellow(`请手动更新 ${npmName}，当前版本${currentVersion}，最新版本${newestVersion}
               use npm   :   npm install -g ${npmName}
               use yarn  :   yarn add -g ${npmName}`),
    )
  }
}

// 检查环境变量
function checkEnv () {
  const dotenv = require('dotenv')
  // 找到环境变量文件
  const dotenvPath = path.resolve(userHome, '.env')

  // 如果环境变量文件存在
  if (pathExists(dotenvPath)) {
    config = dotenv.config({
      path: dotenvPath,
    })
  }
  // 拿到默认配置
  createDefaultConfig()
  // log.verbose('环境变量: ', process.env.CLI_HOME_PATH)

  // 如果没有配置文件就生成默认配置
  function createDefaultConfig () {
    const cliConfig = {
      // 用户主目录
      home: userHome,
    }
    if (process.env.CLI_HOME) {
      cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    } else {
      cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome
  }
}

// 检查主目录
function checkUserHome () {
  // 不存在用户主目录
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登录用户主目录不存在'))
  }
}

// 检查是否为 root 账户启动
function checkRoot () {
  const rootCheck = require('root-check')
  rootCheck()
}

// 检查脚手架版本更新
function checkPkgVersion () {
  log.notice(pkg.name, pkg.version)
}
