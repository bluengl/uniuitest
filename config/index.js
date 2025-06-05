export const STATIC_PATH = 'http://127.0.0.1:8110'
export const API_PATH = 'http://127.0.0.1:8110/api'
export const BASE_API_PATH = 'http://127.0.0.1:8110/api/base'
export const GAME_API_PATH = 'http://127.0.0.1:8110/api/game'
export const USER_API_PATH = 'http://127.0.0.1:8110/api/user'
export const ONLINE_API_PATH = 'http://127.0.0.1:8110/api/online'
export const GROUP_API_PATH = 'http://127.0.0.1:8110/api/group'
export const API = {
    // 基础接口
    base: {
        // 获取OpenId
        getOpenId: `${BASE_API_PATH}/getOpenId`,
        // 登录
        login: `${BASE_API_PATH}/login`,
        // 微信登录
        wxLogin: `${BASE_API_PATH}/wxLogin`,
        // 注册
        register: `${BASE_API_PATH}/register`,
        // 退出登录
        logout: `${BASE_API_PATH}/logout`,
        // 获取系统配置
        getSystemConfig: `${BASE_API_PATH}/getSystemConfig`,
    },
    // 用户接口
    user: {
        // 获取用户信息
        getUserInfo: `${USER_API_PATH}/getUserInfo`,
        // 上传头像
        uploadAvatar: `${USER_API_PATH}/uploadAvatar`,
        // 获取当前头像
        getCurrentAvatar: `${USER_API_PATH}/getCurrentAvatar`,
        // 获取用户指定版本的头像
        getAvatarByVersion: `${USER_API_PATH}/getAvatarByVersion`,
        // 获取用户头像列表
        getAvatarList: `${USER_API_PATH}/getAvatarList`,
    },
    // 游戏接口
    game: {
        // 获取游戏列表
        gameList: `${GAME_API_PATH}/gameList`,
        // 获取用户游戏最佳成绩
        getUserHighestScore: `${GAME_API_PATH}/getUserHighestScore`,
        // 获取游戏排行榜
        gameRanking: `${GAME_API_PATH}/gameRanking`,
        // 保存用户游戏记录
        saveGameRecord: `${GAME_API_PATH}/saveGameRecord`,
        // 同步离线游戏成绩
        syncOfflineScores: `${GAME_API_PATH}/syncOfflineScores`,
        // 获取游戏配置
        getGameConfig: `${GAME_API_PATH}/getGameConfig`,
    },
    // 在线接口
    online: {
        // 获取在线用户列表
        onlineList: `${ONLINE_API_PATH}/onlineList`,
    },
    // 群组接口
    group: {
        // 获取当前用户群组列表
        groupList: `${GROUP_API_PATH}/groupList`,
        // 获取群组详情
        groupDetail: `${GROUP_API_PATH}/groupDetail`,
        // 创建群组
        createGroup: `${GROUP_API_PATH}/createGroup`,
        // 加入群组
        joinGroup: `${GROUP_API_PATH}/joinGroup`,
        // 退出群组
        exitGroup: `${GROUP_API_PATH}/exitGroup`,
        // 解散群组
        deleteGroup: `${GROUP_API_PATH}/deleteGroup`,
        // 获取群组成员列表
        groupMemberList: `${GROUP_API_PATH}/groupMemberList`,
        // 获取群组消息列表
        groupMessageList: `${GROUP_API_PATH}/groupMessageList`,
        // 发送群组消息
        sendGroupMessage: `${GROUP_API_PATH}/sendGroupMessage`,
    },
}