var keystone = require('keystone');
var middleware = require('../routes/middleware');
var Types = keystone.Field.Types;

/**
 * Enquiry Model
 * =============
 */

var Enquiry = new keystone.List('Enquiry', {
	nocreate: true,
	noedit: true,
	label: 'Messages',
	singular: 'Message'
});

Enquiry.add({
	name: { type: Types.Name, required: true, label: 'Nom' },
	email: { type: Types.Email, required: true, label: 'Email' },
	subject: { type: String, label: 'Sujet' },
	message: { type: Types.Textarea, required: true, label: 'Message' },
	createdAt: { type: Date, default: Date.now, label: 'Envoyé le' },
});

Enquiry.schema.pre('remove', function(next) {
	if(!middleware.getAuthUser().canManageEnquiries) {
		next(new Error('Vous n\'avez pas les autorisations pour supprimer des demandes de la page contact.'));
	}
	next();
});

Enquiry.defaultSort = '-createdAt';
Enquiry.defaultColumns = 'name|15%, subject, email, createdAt';
Enquiry.register();
