module.exports = function (controller) {

    // Add user to the queue
    controller.hears(

      ['add','add (.*)', '(.*) add (.*)'],

      'direct_message,direct_mention,mention',

      add

    );

    // Show users in the queue
    controller.hears(

      ['show','show (.*)','(.*) show (.*)', 'list','list (.*)','(.*) list (.*)'],

      'direct_message,direct_mention,mention',

      queue

    );

    // Delete user in the queue
    controller.hears(

      ['del', 'del (.*)', '(.*) del (.*)'],

      'direct_message,direct_mention,mention',

      del

    );

    // Delete all users in the queue
    controller.hears(

      ['clean','clean (.*)','(.*) clean (.*)'],

      'direct_message,direct_mention,mention',

      clean

    );

    // Show the api of @turnio
    controller.hears(

      ['help', 'help (.*)', '(.*) help (.*)'],

      'direct_message,direct_mention,mention',

      help

    );

    /** Callbacks for hears */

    function help(bot, message) {

      const help = 'Hello '+ '<@'+ message.user +'>! This is my API: ' +'\n' +
            '> `add`  : Add yourself to the queue\n' +
            '> `show` or `list` : Show the queue\n' +
            '> `del`  : Remove yourself from the queue\n' +
            '> `clean`: Delete all users from the queue\n' +
            '> `help` : Show this message\n' +
            'Ping me with any of those commands, ex: Hey `@deploy_queue` `show` me the queue.';

       bot.reply(message, help);

    }

    function queue(bot, message) {

        // load user from storage...
        controller.storage.teams.get('queue', function(err, queue) {

            if (!queue || !queue.users || queue.users.length == 0) {
                bot.reply(message, "There is no one in the queue at the moment, ping me with the command `add` to add yourself.");
            } else {
                bot.reply(message, generateQueueList(queue.users));
            }

        });

    }

    function add(bot, message) {

        controller.storage.teams.get('queue', function(err, queue) {
            if(err){
                return throwError(err);
            }

            if (!queue || !queue.users) {
                queue = {
                    'id': 'queue',
                    'users': []
                };
            }

            var user = findUser(queue.users,message.user);

            if(user){
                bot.reply(message, "<"+ user.name +">, You are in the queue already. When it's your turn, I'll let you know.");
                bot.reply(message, generateQueueList(queue.users));
            } else {

                userInfo(bot.api, message.user, function (err, user) {

                    queue.users.push({
                        id: message.user,
                        name: '@' + user.name
                    });

                    controller.storage.teams.save(queue, function(err,saved) {
                        if (err) {
                            bot.reply(message, 'I experienced an error adding your task: ' + err);
                        } else {

                            bot.api.reactions.add({
                                name: 'pepevoteyes',
                                channel: message.channel,
                                timestamp: message.ts
                            });

                            bot.reply(message, generateQueueList(queue.users));
                        }
                    });
                });
            }
        });
    }

    function del(bot, message) {

        controller.storage.teams.get('queue', function(err, queue) {
            if(err){
                return throwError(err);
            }

            if (!queue || !queue.users || queue.users.length == 0 || findUser(queue.users,message.user) === undefined) {
                bot.reply(message, "Either the queue doesn't exist, you aren't in it or the container restarted.\n" +
                                   "You can see the persons in the queue by pinging me with the command `show` or `list`.");
            } else {

                queue.users = queue.users.filter(function(user){
                    return (user.id != message.user);
                });

                controller.storage.teams.save(queue, function(err,saved) {
                    if (err) {
                        bot.reply(message, 'I experienced an error adding your task: ' + err);
                    } else {
                        bot.api.reactions.add({
                            name: 'pepeok',
                            channel: message.channel,
                            timestamp: message.ts
                        });

                        if(queue.users && queue.users.length > 0){

                            bot.reply(message, '<'+ queue.users[0].name +"> it's your turn to deploy! Ping me with the command `del` when you're done.");
                        }
                    }
                });
            }
        });

    }

    function clean(bot, message) {

        controller.storage.teams.get('queue', function(err, queue) {
            if(err){
                return throwError(err);
            }

            if (!queue || !queue.users || queue.users.length == 0) {
                bot.reply(message, 'There is no one in the queue at the moment.');
            } else {
                queue.users = [];
                controller.storage.teams.save(queue, function(err,saved) {
                    if (err) {
                        bot.reply(message, 'I experienced an error adding your task: ' + err);
                    } else {
                        bot.api.reactions.add({
                            name: 'pepecowboy',
                            channel: message.channel,
                            timestamp: message.ts
                        });
                    }
                });
            }
        });

    }


    /** Utils */

    // (Async) get info user by id
    function userInfo(api, id, next){
        api.users.info({
           user: id
        }, function (err, res) {
            next(err, res.user);
        });
    }

    // Generate list of users
    function generateQueueList(users) {

        var text = 'The following people are in the queue: \n';

        users.forEach(function(user, i){
            text = text + '> `' +  (i + 1) + 'º` ' +  user.name + '\n';
        });

        return text;
    }

    // Find user by id
    function findUser(users, id){

        return users.find(function(user, i){ return (user.id === id);});
    }

};
