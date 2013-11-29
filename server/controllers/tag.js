/**
 * 节点相关的控制逻辑
 * @author heroic
 */

/**
 * Module dependencies
 */
var async = require('async'),
  _ = require('lodash'),
  api = require('../../api'),
  NotFoundError = require('../../utils/error').NotFoundError;

/** 节点下面的话题列表 */
exports.topics = function(req, res, next) {
  var name = req.params.name,
    filter = req.params.type;

  var sort,
    conditions = {
      'tag.name': name
    };
  switch(filter) {
  case 'excellent':
    conditions.excellent = true;
    break;
  case 'no-comment':
    conditions.commentCount = {
      $lte: 0
    };
    break;
  case 'latest':
    break;
  default:
    sort = {
      createdAt: -1,
      lastCommentedAt: -1
    };
  }

  async.parallel({
    topics: function(next) {
      api.topic.query({
        query: conditions,
        sort: sort
      }, function(err, results) {
        next(err, _.extend(results.topics, {
          totalCount: results.totalCount
        }));
      });
    },
    tags: function(next) {
      api.tag.query({
        pageSize: Infinity
      }, function(err, results) {
        if (err) {
          return next(err);
        }
        var tags = results.tags;
        next(null, _.groupBy(tags, function(tag) {
          return tag.section.name;
        }));
      });
    }
  }, function(err, results) {
    if (err) {
      return next(err);
    }
    req.breadcrumbs(name);
    res.render('topics', _.extend(results, {
      path: '/tag/' + req.tag.name + '/topics',
      filterType: filter,
      tag: req.tag
    }));
  });
};

/** 根据节点名获取节点 */
exports.load = function(req, res, next) {
  var name = req.params.name;
  api.tag.get.call(req, {
    name: name
  }, function(err, tag) {
    if (err) {
      return next(err);
    }
    if (!tag) {
      return next(new NotFoundError('该节点不存在。'));
    }
    req.tag = tag;
    next();
  });
};