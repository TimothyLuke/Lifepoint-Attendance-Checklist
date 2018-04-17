app.filter('readableDate', function() {
    return function(event, style) {


        if(!event.startDate) {
            return;
        }

        var startDate = new Date(event.startDate);
        var endDate = new Date(event.endDate);

       

        ///////////////////////////////////////////////

        var noEndDate = startDate.format('g:ia j M Y') == endDate.format('g:ia j M Y');
        var sameYear = (startDate.format('Y') == endDate.format('Y'));
        var sameMonth = (startDate.format('M Y') == endDate.format('M Y'));
        var sameDay = (startDate.format('j M Y') == endDate.format('j M Y'));

        switch (style) {
            case 'short':
                // console.log('SHORT', startDate, endDate);
                if (noEndDate) {
                    return startDate.format('j M')
                }

                if (sameDay) {
                    //8am - 9am Thursday 21 May 2016
                    return startDate.format('j M')
                }

                if (sameMonth) {
                    //20 - 21 May 2016
                    return startDate.format('j') + ' - ' + endDate.format('j M')
                }

                if (sameYear) {
                    //20 Aug - 21 Sep 2016
                    return startDate.format('j') + ' - ' + endDate.format('j M')
                }

                //20 Aug 2015 - 21 Sep 2016
                return startDate.format('j M Y') + ' - ' + endDate.format('j M Y')

                break;
            default:
                if (noEndDate) {
                    return startDate.format('g:ia l j M Y')
                }

                if (sameDay) {
                    //8am - 9am Thursday 21 May 2016
                    return startDate.format('g:ia') + ' - ' + endDate.format('g:ia l j M Y')
                }

                if (sameMonth) {
                    //20 - 21 May 2016
                    return startDate.format('j') + ' - ' + endDate.format('j M Y')
                }

                if (sameYear) {
                    //20 Aug - 21 Sep 2016
                    return startDate.format('j M') + ' - ' + endDate.format('j M Y')
                }

                //20 Aug 2015 - 21 Sep 2016
                return startDate.format('j M Y') + ' - ' + endDate.format('j M Y')

                break;
        }

    };
});