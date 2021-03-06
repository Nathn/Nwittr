const Tweet = require('../models/Tweet');
const User = require('../models/User');
const moment = require('moment');
moment.locale('fr')

// The default controller for this app
// The home page
exports.indexPage = async (req, res) => {
	try {
		if (req.user && req.user.lang == "en") {
			moment.locale('en')
		} else {
			moment.locale('fr')
		}

		var squaks;

		if (req.user) {
			if (!req.user.following.map(obj => obj.toString()).includes(req.user._id.toString())) {
				await User.findByIdAndUpdate(
					req.user._id, {
						'$addToSet': {
							following: req.user._id
						}
					}, {
						new: true
					}
				);
			}

			var following = req.user.following.map(obj => obj.toString());

			squaks = await Tweet.find({
					author: following
				})
				.populate('author')
				.limit(500)
				.sort({
					created: 'desc'
				});

			await Tweet.find({
					author: following
				})
				.populate('author')
				.limit(500)
				.sort({
					created: 'desc'
				});

			var profiles = await User.find({
					_id: {
						"$nin": following
					}
				})
				.limit(3)
				.sort({
					likes: -1,
					verified: -1
				});
		} else {
			squaks = await Tweet.find()
				.populate('author')
				.limit(500)
				.sort({
					created: 'desc'
				});
			function filter_users(squak) {
				return squak.author.confirmed == true;
			}
			squaks = squaks.filter(filter_users);
		}


		res.render('index', {
			squaks,
			profiles,
			moment,
			status: req.flash('status').pop() || req.query.status || '200'
		});

	} catch (e) {
		console.log(e);
		res.redirect('/error')
	}

}

exports.notificationsPage = async (req, res) => {
	if (!req.user) return res.redirect('/login')
	var user = await User.findOne({
		_id: req.user._id
	}).populate('notifications.author')
	  .populate('readnotifications.author');
	var notifications = user.notifications
	var readnotifications = user.readnotifications
	var readnotifs = user.readnotifications.concat(user.notifications)
	if (notifications && readnotifications) {
		notifications.sort(function(a,b){
  			return b.date - a.date;
		});
		readnotifications.sort(function(a,b){
  			return b.date - a.date;
		});
	}
	await User.findByIdAndUpdate({
		_id: req.user._id
	}, {
		$set: {
			notifications: [],
			readnotifications: readnotifs
		}
	});
	res.render('notifications', {
		unreadnotifications: notifications || [],
		readnotifications: readnotifications || [],
		moment,
		status: req.flash('status').pop() || req.query.status || '200'
	});
}
