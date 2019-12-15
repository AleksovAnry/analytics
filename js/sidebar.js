/**
 * Data Analytics
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the LICENSE.md file.
 *
 * @author Marcel Scherello <audioplayer@scherello.de>
 * @copyright 2019 Marcel Scherello
 */

'use strict';

/**
 * @namespace OCA.Analytics.Sidebar
 */
OCA.Analytics.Sidebar = {
    sidebar_tabs: {},

    showSidebar: function (evt) {
        let navigationItem = evt.target;
        let datasetId = navigationItem.dataset.id;
        let datasetType = navigationItem.dataset.type;
        let appsidebar = document.getElementById('app-sidebar');

        if (appsidebar.dataset.id === datasetId) {
            OCA.Analytics.Sidebar.hideSidebar();
        } else {

            document.getElementById('sidebarTitle').innerHTML = navigationItem.dataset.name;
            //document.getElementById('sidebarMime').innerHTML = navigationItem.dataset.id;

            if (appsidebar.dataset.id === '') {
                $('#sidebarClose').on('click', OCA.Analytics.Sidebar.hideSidebar);

                OCA.Analytics.Sidebar.constructTabs(datasetType);
                document.getElementById('tabHeaderDataset').classList.add('selected');
                OC.Apps.showAppSidebar();
            }
            appsidebar.dataset.id = datasetId;
            document.querySelector('.tabHeader.selected').click();
        }
    },

    registerSidebarTab: function (tab) {
        let id = tab.id;
        this.sidebar_tabs[id] = tab;
    },

    constructTabs: function (datasetType) {
        let tab = {};

        document.querySelector('.tabHeaders').innerHTML = '';
        document.querySelector('.tabsContainer').innerHTML = '';

        OCA.Analytics.Sidebar.registerSidebarTab({
            id: 'tabHeaderDataset',
            class: 'tabContainerDataset',
            tabindex: '1',
            name: t('analytics', 'Report'),
            action: OCA.Analytics.Sidebar.Dataset.tabContainerDataset,
        });

        OCA.Analytics.Sidebar.registerSidebarTab({
            id: 'tabHeaderData',
            class: 'tabContainerData',
            tabindex: '3',
            name: t('analytics', 'Data'),
            action: OCA.Analytics.Sidebar.Data.tabContainerData,
        });

        OCA.Analytics.Sidebar.registerSidebarTab({
            id: 'tabHeaderThreshold',
            class: 'tabContainerThreshold',
            tabindex: '2',
            name: t('analytics', 'Thresholds'),
            action: OCA.Analytics.Sidebar.Threshold.tabContainerThreshold,
        });

        OCA.Analytics.Sidebar.registerSidebarTab({
            id: 'tabHeaderShare',
            class: 'tabContainerShare',
            tabindex: '4',
            name: t('analytics', 'Share'),
            action: OCA.Analytics.Sidebar.Share.tabContainerShare,
        });

        let items = _.map(OCA.Analytics.Sidebar.sidebar_tabs, function (item) {
            return item;
        });
        items.sort(OCA.Analytics.Sidebar.sortByName);

        for (tab in items) {
            let li = $('<li/>').addClass('tabHeader')
                .attr({
                    'id': items[tab].id,
                    'tabindex': items[tab].tabindex
                });
            let atag = $('<a/>').text(items[tab].name);
            atag.prop('title', items[tab].name);
            li.append(atag);
            $('.tabHeaders').append(li);

            let div = $('<div/>').addClass('tab ' + items[tab].class)
                .attr({
                    'id': items[tab].class
                });
            $('.tabsContainer').append(div);
            $('#' + items[tab].id).on('click', items[tab].action);
        }
    },

    hideSidebar: function () {
        document.getElementById('app-sidebar').dataset.id = '';
        OC.Apps.hideAppSidebar();
        document.querySelector('.tabHeaders').innerHTML = '';
        document.querySelector('.tabsContainer').innerHTML = '';
    },

    resetView: function () {
        document.querySelector('.tabHeader.selected').classList.remove('selected');
        $('.tab').addClass('hidden');
    },

    sortByName: function (a, b) {
        let aName = a.tabindex;
        let bName = b.tabindex;
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    },

};
OCA.Analytics.Sidebar.Dataset = {

    tabContainerDataset: function () {
        let datasetId = document.getElementById('app-sidebar').dataset.id;

        OCA.Analytics.Sidebar.resetView();
        document.getElementById('tabHeaderDataset').classList.add('selected');
        document.getElementById('tabContainerDataset').classList.remove('hidden');
        document.getElementById('tabContainerDataset').innerHTML = '<div style="text-align:center; word-wrap:break-word;" class="get-metadata"><p><img src="' + OC.imagePath('core', 'loading.gif') + '"><br><br></p><p>' + t('analytics', 'Reading data') + '</p></div>';

        $.ajax({
            type: 'GET',
            url: OC.generateUrl('apps/analytics/dataset/') + datasetId,
            success: function (data) {
                let table;
                if (data !== false) {
                    table = document.getElementById('templateDataset').cloneNode(true);
                    table.id = 'sidebarDataset';
                    document.getElementById('tabContainerDataset').innerHTML = '';
                    document.getElementById('tabContainerDataset').appendChild(table);
                    document.getElementById('sidebarDatasetName').value = data.name;
                    document.getElementById('sidebarDatasetSubheader').value = data.subheader;
                    document.getElementById('sidebarDatasetParent').value = data.parent;
                    document.getElementById('sidebarDatasetType').value = data.type;
                    document.getElementById('sidebarDatasetType').addEventListener('change', OCA.Analytics.Sidebar.Dataset.handleDatasetTypeChange);
                    document.getElementById('sidebarDatasetLink').value = data.link;
                    document.getElementById('sidebarDatasetLinkButton').addEventListener('click', OCA.Analytics.Sidebar.Dataset.handleDatasetParameterButton);
                    document.getElementById('sidebarDatasetVisualization').value = data.visualization;
                    document.getElementById('sidebarDatasetChart').value = data.chart;
                    document.getElementById('sidebarDatasetDimension1').value = data.dimension1;
                    document.getElementById('sidebarDatasetDimension2').value = data.dimension2;
                    document.getElementById('sidebarDatasetDimension3').value = data.dimension3;
                    document.getElementById('sidebarDatasetDeleteButton').addEventListener('click', OCA.Analytics.Sidebar.Dataset.handleDatasetDeleteButton);
                    document.getElementById('sidebarDatasetUpdateButton').addEventListener('click', OCA.Analytics.Sidebar.Dataset.handleDatasetUpdateButton);
                    OCA.Analytics.Sidebar.Dataset.handleDatasetTypeChange();
                } else {
                    table = '<div style="margin-left: 2em;" class="get-metadata"><p>' + t('analytics', 'No maintenance possible') + '</p></div>';
                    document.getElementById('tabContainerDataset').innerHTML = table;
                }
            }
        });

    },

    handleDatasetDeleteButton: function () {
        let id = document.getElementById('app-sidebar').dataset.id;
        OC.dialogs.confirm(
            t('analytics', 'Are you sure?') + ' ' + t('analytics', 'All data will be deleted!'),
            t('analytics', 'Delete Report'),
            function (e) {
                if (e === true) {
                    OCA.Analytics.Sidebar.Backend.deleteDataset(id);
                    OCA.Analytics.UI.resetContent();
                    OCA.Analytics.Sidebar.hideSidebar();
                }
            },
            true
        );
    },

    handleDatasetUpdateButton: function () {
        OCA.Analytics.Sidebar.Backend.updateDataset();
    },

    handleDatasetTypeChange: function () {
        let type = parseInt(document.getElementById('sidebarDatasetType').value);
        if (type === OCA.Analytics.TYPE_INTERNAL_DB) {
            document.getElementById('datasetLinkRow').style.display = 'none';
            document.getElementById('datasetDimensionSection').style.display = 'table';
            document.getElementById('datasetDimensionSectionHeader').style.removeProperty('display');
            document.getElementById('datasetVisualizationSection').style.display = 'table';
            document.getElementById('datasetVisualizationSectionHeader').style.removeProperty('display');
        } else if (type === OCA.Analytics.TYPE_INTERNAL_FILE || type === OCA.Analytics.TYPE_GIT || type === OCA.Analytics.TYPE_EXTERNAL_FILE) {
            document.getElementById('datasetLinkRow').style.display = 'table-row';
            document.getElementById('datasetDimensionSection').style.display = 'none';
            document.getElementById('datasetDimensionSectionHeader').style.display = 'none';
            document.getElementById('datasetVisualizationSection').style.display = 'table';
            document.getElementById('datasetVisualizationSectionHeader').style.removeProperty('display');
        } else {
            document.getElementById('datasetLinkRow').style.display = 'none';
            document.getElementById('datasetDimensionSection').style.display = 'none';
            document.getElementById('datasetDimensionSectionHeader').style.display = 'none';
            document.getElementById('datasetVisualizationSection').style.display = 'none';
            document.getElementById('datasetVisualizationSectionHeader').style.display = 'none';
        }
    },

    handleDatasetParameterButton: function () {
        let type = parseInt(document.getElementById('sidebarDatasetType').value);
        if (type === OCA.Analytics.TYPE_GIT) {
            OC.dialogs.prompt(
                t('analytics', 'Enter GitHub User/Repository. The \'/\' is important.'),
                t('analytics', 'GitHub API'),
                function (button, val) {
                    if (button === true) document.getElementById('sidebarDatasetLink').value = val;
                },
                true,
                "user/repo");
        } else if (type === OCA.Analytics.TYPE_INTERNAL_FILE) {
            let mimeparts = ['text/csv', 'text/plain'];
            OC.dialogs.filepicker(
                t('analytics', 'Select file'),
                function (path) {
                    document.getElementById('sidebarDatasetLink').value = path;
                },
                false,
                mimeparts,
                true,
                1);
        } else if (type === OCA.Analytics.TYPE_EXTERNAL_FILE) {
            OC.dialogs.prompt(
                t('analytics', 'Enter the URL of external CSV data'),
                t('analytics', 'External File'),
                function (button, val) {
                    if (button === true) document.getElementById('sidebarDatasetLink').value = val;
                },
                true,
                "");
        }
    },
};

OCA.Analytics.Sidebar.Data = {

    tabContainerData: function () {
        let datasetId = document.getElementById('app-sidebar').dataset.id;

        OCA.Analytics.Sidebar.resetView();
        document.getElementById('tabHeaderData').classList.add('selected');
        document.getElementById('tabContainerData').classList.remove('hidden');
        document.getElementById('tabContainerData').innerHTML = '<div style="text-align:center; word-wrap:break-word;" class="get-metadata"><p><img src="' + OC.imagePath('core', 'loading.gif') + '"><br><br></p><p>' + t('analytics', 'Reading data') + '</p></div>';

        $.ajax({
            type: 'GET',
            url: OC.generateUrl('apps/analytics/dataset/') + datasetId,
            success: function (data) {
                let table;
                if (data !== false && parseInt(data.type) === OCA.Analytics.TYPE_INTERNAL_DB) {
                    table = document.getElementById('templateData').cloneNode(true);
                    table.id = 'tableData';
                    document.getElementById('tabContainerData').innerHTML = '';
                    document.getElementById('tabContainerData').appendChild(table);
                    document.getElementById('DataTextDimension1').innerText = data.dimension1;
                    document.getElementById('DataTextDimension2').innerText = data.dimension2;
                    document.getElementById('DataTextDimension3').innerText = data.dimension3;
                    //document.getElementById('DataTextDimension3').addEventListener('keydown', OCA.Analytics.Sidebar.Data.handleDataInputEnter);
                    document.getElementById('updateDataButton').addEventListener('click', OCA.Analytics.Sidebar.Data.handleDataUpdateButton);
                    document.getElementById('deleteDataButton').addEventListener('click', OCA.Analytics.Sidebar.Data.handleDataDeleteButton);
                    document.getElementById('importDataFileButton').addEventListener('click', OCA.Analytics.Sidebar.Data.handleDataImportFileButton);
                    document.getElementById('importDataClipboardButton').addEventListener('click', OCA.Analytics.Sidebar.Data.handleDataImportClipboardButton);
                    document.getElementById('apiLink').addEventListener('click', OCA.Analytics.Sidebar.Data.handleDataApiButton);

                    document.getElementById('DataDimension3').addEventListener('keydown', function (event) {
                        if (event.key === 'Enter') {
                            OCA.Analytics.Sidebar.Backend.updateData();
                            document.getElementById('DataDimension2').focus();
                            document.getElementById('DataDimension2').value = '';
                            document.getElementById('DataDimension3').value = '';
                        }
                    });
                } else {
                    table = '<div style="margin-left: 2em;" class="get-metadata"><p>' + t('analytics', 'Data maintenance is not possible for this type of report') + '</p></div>';
                    document.getElementById('tabContainerData').innerHTML = table;
                }
            }
        });
    },

    handleDataUpdateButton: function () {
        OCA.Analytics.Sidebar.Backend.updateData();
    },

    handleDataDeleteButton: function () {
        OCA.Analytics.Sidebar.Backend.deleteData();
    },

    handleDataImportFileButton: function () {
        let mimeparts = ['text/csv', 'text/plain'];
        OC.dialogs.filepicker(t('analytics', 'Select file'), OCA.Analytics.Sidebar.Backend.importFileData.bind(this), false, mimeparts, true, 1);
    },

    handleDataImportClipboardButton: function () {
        document.getElementById('importDataClipboardText').attributes.removeNamedItem('hidden');
        document.getElementById('importDataClipboardButtonGo').attributes.removeNamedItem('hidden');
        document.getElementById('importDataClipboardButtonGo').addEventListener('click', OCA.Analytics.Sidebar.Backend.importCsvData);
    },

    handleDataApiButton: function () {
        OC.dialogs.message(
            t('analytics', 'Use this endpoint to submit data via an API:')
            + '<br><br>'
            + OC.generateUrl('/apps/analytics/api/1.0/adddata/')
            + document.getElementById('app-sidebar').dataset.id
            + '<br><br>'
            + t('analytics', 'Detail instructions at:') + '<br>https://github.com/rello/analytics/wiki/API',
            t('analytics', 'REST API parameters'),
            'info',
            OC.dialogs.OK_BUTTON,
            function (e) {
            },
            true,
            true
        );
    }
};

OCA.Analytics.Sidebar.Share = {

    tabContainerShare: function () {
        let datasetId = document.getElementById('app-sidebar').dataset.id;

        OCA.Analytics.Sidebar.resetView();
        document.getElementById('tabHeaderShare').classList.add('selected');
        document.getElementById('tabContainerShare').classList.remove('hidden');
        document.getElementById('tabContainerShare').innerHTML = '<div style="text-align:center; word-wrap:break-word;" class="get-metadata"><p><img src="' + OC.imagePath('core', 'loading.gif') + '"><br><br></p><p>' + t('analytics', 'Reading data') + '</p></div>';

        $.ajax({
            type: 'GET',
            url: OC.generateUrl('apps/analytics/share/') + datasetId,
            success: function (data) {

                let linkShareView = document.createElement('div');
                linkShareView.classList.add('linkShareView', 'subView');
                let shareWithList = document.createElement('div');
                shareWithList.classList.add('shareWithList');
                linkShareView.appendChild(shareWithList);

                let shareeListView = document.createElement('div');
                shareeListView.classList.add('shareeListView', 'subView');
                let shareWithList_sharee = document.createElement('div');
                shareWithList_sharee.classList.add('shareWithList');
                shareeListView.appendChild(shareWithList_sharee);

                let li = OCA.Analytics.Sidebar.Share.buildShareLinkRow(0, 0, true);
                shareWithList.appendChild(li);

                if (data !== false) {

                    for (let share of data) {

                        if (parseInt(share.type) === OCA.Analytics.SHARE_TYPE_LINK) {
                            let li = OCA.Analytics.Sidebar.Share.buildShareLinkRow(share.id, share.token, false, share.pass);
                            shareWithList.appendChild(li);
                        } else if (parseInt(share.type) === OCA.Analytics.SHARE_TYPE_USER) {
                            let li = OCA.Analytics.Sidebar.Share.buildShareeRow(share.id, share.uid_owner);
                            shareWithList_sharee.appendChild(li);
                        }
                    }

                    document.getElementById('tabContainerShare').innerHTML = '';
                    document.getElementById('tabContainerShare').appendChild(linkShareView);
                    document.getElementById('tabContainerShare').appendChild(shareeListView);
                } else {
                    let table = '<div style="margin-left: 2em;" class="get-metadata"><p>' + t('analytics', 'No Shares found') + '</p></div>';
                    document.getElementById('tabContainerData').innerHTML = table;
                }

            }
        });

    },

    buildShareLinkRow: function (id, token, add = false, pw = false) {

        let li = document.createElement('li');
        li.dataset.id = id;

        let avatar = document.createElement('div');
        avatar.classList.add('avatar', 'icon-public-white');

        let name = document.createElement('span');
        name.classList.add('username');
        if (add) name.innerText = t('analytics', 'Add Share Link');
        else name.innerText = t('analytics', 'Share Link');

        let moreIcon = document.createElement('a');
        moreIcon.classList.add('icon', 'icon-more');

        let ShareOptionsGroup = document.createElement('span');
        ShareOptionsGroup.classList.add('sharingOptionsGroup');

        let clipboardIcon = document.createElement('a');

        if (add) {
            clipboardIcon.classList.add('icon-add', 'icon', 'new-share');
            clipboardIcon.href = '#';
            clipboardIcon.addEventListener('click', OCA.Analytics.Sidebar.Share.createLinkShare);
            ShareOptionsGroup.appendChild(clipboardIcon);
        } else {
            clipboardIcon.classList.add('clipboard-button', 'icon', 'icon-clippy');
            clipboardIcon.href = OC.generateUrl('/apps/analytics/p/') + token;
            clipboardIcon.target = '_blank';
            ShareOptionsGroup.appendChild(clipboardIcon);
            ShareOptionsGroup.appendChild(OCA.Analytics.Sidebar.Share.buildShareMenu(id, pw));
        }

        li.appendChild(avatar);
        li.appendChild(name);
        li.appendChild(ShareOptionsGroup);
        return li;
    },

    buildShareeRow: function (id, uid_owner) {

        let li = document.createElement('li');
        li.dataset.id = id;

        let avatar = document.createElement('div');
        avatar.classList.add('avatar', 'imageplaceholderseed');
        avatar.style = 'width: 32px;height: 32px;/* background-color: rgb(188, 92, 145); */color: rgb(255, 255, 255);font-weight: normal;text-align: center;line-height: 32px;font-size: 17.6px;';
        avatar.innerText = uid_owner.charAt(0);

        let name = document.createElement('span');
        name.classList.add('username');
        name.innerText = uid_owner;

        let moreIcon = document.createElement('a');
        moreIcon.classList.add('icon', 'icon-more');

        let ShareOptionsGroup = document.createElement('span');
        ShareOptionsGroup.classList.add('sharingOptionsGroup');
        ShareOptionsGroup.appendChild(moreIcon);

        li.appendChild(avatar);
        li.appendChild(name);
        li.appendChild(ShareOptionsGroup);
        return li;
    },

    buildShareMenu: function (id, pw) {
        let shareMenu = document.createElement('div');
        shareMenu.classList.add('share-menu');

        let moreIcon = document.createElement('a');
        moreIcon.classList.add('icon', 'icon-more');
        moreIcon.addEventListener('click', OCA.Analytics.Sidebar.Share.showShareMenu);
        shareMenu.appendChild(moreIcon);

        let popoverMenue = document.createElement('div');
        popoverMenue.classList.add('popovermenu', 'menu');
        popoverMenue.style.display = 'none';
        shareMenu.appendChild(popoverMenue);

        let ul = document.createElement('ul');
        popoverMenue.appendChild(ul);

        let liShowPassword = document.createElement('li');
        let spanShowPassword = document.createElement('span');
        spanShowPassword.classList.add('menuitem');
        let inputShowPassword = document.createElement('input');
        inputShowPassword.type = 'checkbox';
        inputShowPassword.name = 'showPassword';
        inputShowPassword.id = 'showPassword-' + id;
        inputShowPassword.classList.add('checkbox', 'showPasswordCheckbox');
        inputShowPassword.addEventListener('click', OCA.Analytics.Sidebar.Share.showPassMenu);
        let labelShowPassword = document.createElement('label');
        labelShowPassword.setAttribute('for', 'showPassword-' + id);
        labelShowPassword.innerText = t('analytics', 'Password protect');
        liShowPassword.appendChild(spanShowPassword);
        spanShowPassword.appendChild(inputShowPassword);
        spanShowPassword.appendChild(labelShowPassword);

        let liPassMenu = document.createElement('li');
        liPassMenu.classList.add('linkPassMenu', 'hidden');
        let spanPassMenu = document.createElement('span');
        spanPassMenu.classList.add('menuitem', 'icon-share-pass');
        let inputPassMenu = document.createElement('input');
        inputPassMenu.type = 'password';
        inputPassMenu.placeholder = t('analytics', 'Password for public link');
        inputPassMenu.id = 'linkPassText-' + id;
        inputPassMenu.classList.add('linkPassText');
        let inputPassConfirm = document.createElement('input');
        inputPassConfirm.type = 'submit';
        inputPassConfirm.dataset.id = id;
        inputPassConfirm.value = '';
        inputPassConfirm.classList.add('icon-confirm', 'share-pass-submit');
        inputPassConfirm.setAttribute('style', 'width: auto !important');
        inputPassConfirm.addEventListener('click', OCA.Analytics.Sidebar.Share.updateShare);
        liPassMenu.appendChild(spanPassMenu);
        spanPassMenu.appendChild(inputPassMenu);
        spanPassMenu.appendChild(inputPassConfirm);

        let liUnshare = document.createElement('li');
        let aUnshare = document.createElement('a');
        aUnshare.href = '#';
        aUnshare.classList.add('unshare');
        aUnshare.dataset.id = id;
        aUnshare.addEventListener('click', OCA.Analytics.Sidebar.Share.removeShare);
        let spanUnshare = document.createElement('span');
        spanUnshare.classList.add('icon', 'icon-delete');
        let spanUnshareTxt = document.createElement('span');
        spanUnshareTxt.innerText = t('analytics', 'Delete share link');
        liUnshare.appendChild(aUnshare);
        aUnshare.appendChild(spanUnshare);
        aUnshare.appendChild(spanUnshareTxt);

        ul.appendChild(liShowPassword);
        ul.appendChild(liPassMenu);
        ul.appendChild(liUnshare);

        if (pw) {
            liPassMenu.classList.remove('hidden');
            inputShowPassword.checked = true;
        }
        return shareMenu;
    },

    showShareMenu: function (evt) {
        let toggleState = evt.target.nextSibling.style.display;
        if (toggleState === 'none') evt.target.nextSibling.style.display = 'block';
        else evt.target.nextSibling.style.display = 'none';
    },

    showPassMenu: function (evt) {
        let toggleState = evt.target.checked;
        if (toggleState === true) evt.target.parentNode.parentNode.nextSibling.classList.remove('hidden');
        else evt.target.parentNode.parentNode.nextSibling.classList.add('hidden');
    },

    createLinkShare: function () {
        let datasetId = document.getElementById('app-sidebar').dataset.id;
        $.ajax({
            type: 'POST',
            url: OC.generateUrl('apps/analytics/share'),
            data: {
                'datasetId': datasetId,
                'type': OCA.Analytics.SHARE_TYPE_LINK,
            },
            success: function () {
                document.querySelector('.tabHeader.selected').click();
            }.bind()
        });
    },

    removeShare: function (evt) {
        let shareId = evt.target.parentNode.dataset.id;
        $.ajax({
            type: 'DELETE',
            url: OC.generateUrl('apps/analytics/share/') + shareId,
            success: function (data) {
                document.querySelector('.tabHeader.selected').click();
            }.bind()
        });
    },

    updateShare: function (evt) {
        let shareId = evt.target.dataset.id;
        let password = evt.target.previousSibling.value;
        $.ajax({
            type: 'PUT',
            url: OC.generateUrl('apps/analytics/share/') + shareId,
            data: {
                'password': password
            },
            success: function () {
                document.querySelector('.tabHeader.selected').click();
            }.bind()
        });
    },
};

OCA.Analytics.Sidebar.Threshold = {

    tabContainerThreshold: function () {
        let datasetId = document.getElementById('app-sidebar').dataset.id;

        OCA.Analytics.Sidebar.resetView();
        document.getElementById('tabHeaderThreshold').classList.add('selected');
        document.getElementById('tabContainerThreshold').classList.remove('hidden');
        document.getElementById('tabContainerThreshold').innerHTML = '<div style="text-align:center; word-wrap:break-word;" class="get-metadata"><p><img src="' + OC.imagePath('core', 'loading.gif') + '"><br><br></p><p>' + t('analytics', 'Reading data') + '</p></div>';


        $.ajax({
            type: 'GET',
            url: OC.generateUrl('apps/analytics/dataset/') + datasetId,
            success: function (data) {
                let table;
                if (data !== false && parseInt(data.type) === OCA.Analytics.TYPE_INTERNAL_DB) {
                    table = document.getElementById('templateThreshold').cloneNode(true);
                    table.id = 'tableThreshold';
                    document.getElementById('tabContainerThreshold').innerHTML = '';
                    document.getElementById('tabContainerThreshold').appendChild(table);
                    document.getElementById('sidebarThresholdTextDimension1').innerText = data.dimension1;
                    document.getElementById('sidebarThresholdTextDimension3').innerText = data.dimension3;
                    document.getElementById('createThresholdButton').addEventListener('click', OCA.Analytics.Sidebar.Threshold.handleThresholdCreateButton);
                } else {
                    table = '<div style="margin-left: 2em;" class="get-metadata"><p>' + t('analytics', 'Data maintenance is not possible for this type of report') + '</p></div>';
                    document.getElementById('tabContainerThreshold').innerHTML = table;
                }
            }
        });

        $.ajax({
            type: 'GET',
            url: OC.generateUrl('apps/analytics/threshold/') + datasetId,
            success: function (data) {
                if (data !== false) {
                    document.getElementById('sidebarThresholdList').innerHTML = '';
                    for (let threshold of data) {
                        let li = OCA.Analytics.Sidebar.Threshold.buildThresholdRow(threshold);
                        document.getElementById('sidebarThresholdList').appendChild(li);
                    }
                }
            }
        });
    },

    handleThresholdCreateButton: function () {
        OCA.Analytics.Sidebar.Backend.createThreashold();
    },

    handleThresholdDeleteButton: function (evt) {
        let thresholdId = evt.target.dataset.id;
        OCA.Analytics.Sidebar.Backend.deleteThreshold(thresholdId);
    },

    buildThresholdRow: function (data) {

        let bulletColor, bullet;
        data.severity = parseInt(data.severity);
        if (data.severity === 2) {
            bulletColor = 'red';
        } else if (data.severity === 3) {
            bulletColor = 'orange';
        } else {
            bulletColor = 'green';
        }

        if (data.severity === 1) {
            bullet = document.createElement('img');
            bullet.src = OC.imagePath('notifications', 'notifications-dark.svg');
            bullet.classList.add('thresholdBullet');
        } else {
            bullet = document.createElement('div');
            bullet.style.backgroundColor = bulletColor;
            bullet.classList.add('thresholdBullet');
        }

        let item = document.createElement('div');
        item.classList.add('thresholdItem');

        let text = document.createElement('div');
        text.classList.add('thresholdText');
        text.innerText = data.dimension1 + ' ' + data.option + ' ' + data.dimension3;

        let tDelete = document.createElement('div');
        tDelete.classList.add('icon-close');
        tDelete.dataset.id = data.id;
        tDelete.addEventListener('click', OCA.Analytics.Sidebar.Threshold.handleThresholdDeleteButton);

        item.appendChild(bullet);
        item.appendChild(text);
        item.appendChild(tDelete);
        return item;
    },

};


OCA.Analytics.Sidebar.Backend = {

    deleteDataset: function (datasetId) {
        $.ajax({
            type: 'DELETE',
            url: OC.generateUrl('apps/analytics/dataset/') + datasetId,
            success: function (data) {
                OCA.Analytics.Core.initNavigation();
            }.bind()
        });
    },

    updateDataset: function () {
        let datasetId = parseInt(document.getElementById('app-sidebar').dataset.id);
        $.ajax({
            type: 'PUT',
            url: OC.generateUrl('apps/analytics/dataset/') + datasetId,
            data: {
                'name': document.getElementById('sidebarDatasetName').value,
                'subheader': document.getElementById('sidebarDatasetSubheader').value,
                'parent': document.getElementById('sidebarDatasetParent').value,
                'type': document.getElementById('sidebarDatasetType').value,
                'link': document.getElementById('sidebarDatasetLink').value,
                'visualization': document.getElementById('sidebarDatasetVisualization').value,
                'chart': document.getElementById('sidebarDatasetChart').value,
                'dimension1': document.getElementById('sidebarDatasetDimension1').value,
                'dimension2': document.getElementById('sidebarDatasetDimension2').value,
                'dimension3': document.getElementById('sidebarDatasetDimension3').value
            },
            success: function () {
                OCA.Analytics.Core.initNavigation(datasetId);
            }.bind()
        });
    },

    updateData: function () {
        let datasetId = parseInt(document.getElementById('app-sidebar').dataset.id);
        let button = document.getElementById('updateDataButton');
        button.classList.add('loading');
        button.disabled = true;
        $.ajax({
            type: 'PUT',
            url: OC.generateUrl('apps/analytics/data/') + datasetId,
            data: {
                'dimension1': document.getElementById('DataDimension1').value,
                'dimension2': document.getElementById('DataDimension2').value,
                'dimension3': document.getElementById('DataDimension3').value,
            },
            success: function (data) {
                button.classList.remove('loading');
                button.disabled = false;
                if (data.error === 0) {
                    OCA.Analytics.UI.notification('success', data.insert + t('analytics', ' records inserted, ') + data.update + t('analytics', ' records updated'));
                    OCA.Analytics.UI.resetContent();
                    OCA.Analytics.Backend.getData();
                } else {
                    OCA.Analytics.UI.notification('error', data.error);
                }
            }
        });
    },

    deleteData: function () {
        let datasetId = parseInt(document.getElementById('app-sidebar').dataset.id);
        let button = document.getElementById('deleteDataButton');
        button.classList.add('loading');
        button.disabled = true;
        $.ajax({
            type: 'DELETE',
            url: OC.generateUrl('apps/analytics/data/') + datasetId,
            data: {
                'dimension1': document.getElementById('DataDimension1').value,
                'dimension2': document.getElementById('DataDimension2').value,
            },
            success: function (data) {
                button.classList.remove('loading');
                button.disabled = false;
                OCA.Analytics.UI.resetContent();
                OCA.Analytics.Backend.getData();
            }
        });
    },

    importCsvData: function () {
        let datasetId = parseInt(document.getElementById('app-sidebar').dataset.id);
        let button = document.getElementById('importDataClipboardButton');
        button.classList.add('loading');
        button.disabled = true;
        $.ajax({
            type: 'POST',
            url: OC.generateUrl('apps/analytics/data/importCSV'),
            data: {
                'datasetId': datasetId,
                'import': document.getElementById('importDataClipboardText').value,
            },
            success: function (data) {
                button.classList.remove('loading');
                button.disabled = false;
                if (data.error === 0) {
                    OCA.Analytics.UI.notification('success', data.insert + t('analytics', ' records inserted, ') + data.update + t('analytics', ' records updated'));
                    document.querySelector('#navigationDatasets [data-id="' + datasetId + '"]').click();
                } else {
                    OCA.Analytics.UI.notification('error', data.error);
                }
            }.bind(),
            error: function () {
                OCA.Analytics.UI.notification('error', t('analytics', 'Technical error. Please check the logs'));
                button.classList.remove('loading');
                button.disabled = false;
            }
        });
    },

    importFileData: function (path) {
        let datasetId = parseInt(document.getElementById('app-sidebar').dataset.id);
        let button = document.getElementById('importDataFileButton');
        button.classList.add('loading');
        button.disabled = true;

        $.ajax({
            type: 'POST',
            url: OC.generateUrl('apps/analytics/data/importFile'),
            data: {
                'datasetId': datasetId,
                'path': path,
            },
            success: function (data) {
                button.classList.remove('loading');
                button.disabled = false;
                if (data.error === 0) {
                    OCA.Analytics.UI.notification('success', data.insert + t('analytics', ' records inserted, ') + data.update + t('analytics', ' records updated'));
                    document.querySelector('#navigationDatasets [data-id="' + datasetId + '"]').click();
                } else {
                    OCA.Analytics.UI.notification('error', data.error);
                }
            }.bind(),
            error: function () {
                OCA.Analytics.UI.notification('error', t('analytics', 'Technical error. Please check the logs'));
                button.classList.remove('loading');
                button.disabled = false;
            }
        });
    },

    createThreashold: function () {
        let datasetId = parseInt(document.getElementById('app-sidebar').dataset.id);
        let url = OC.generateUrl('apps/analytics/threshold');

        $.ajax({
            type: 'POST',
            url: url,
            data: {
                'datasetId': datasetId,
                'dimension1': document.getElementById('sidebarThresholdDimension1').value,
                'option': document.getElementById('sidebarThresholdOption').value,
                'dimension3': document.getElementById('sidebarThresholdDimension3').value,
                'severity': document.getElementById('sidebarThresholdSeverity').value,
            },
            success: function () {
                document.querySelector('.tabHeader.selected').click();
            }.bind()
        });
    },

    deleteThreshold: function (thresholdId) {

        $.ajax({
            type: 'DELETE',
            url: OC.generateUrl('apps/analytics/threshold/') + thresholdId,
            success: function (data) {
                document.querySelector('.tabHeader.selected').click();
            }
        });
    },

};
