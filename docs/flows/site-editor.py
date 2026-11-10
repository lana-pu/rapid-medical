# Generates site-editor.json next to this file (repeated page parts stay identical). Run: python3 docs/flows/site-editor.py
import json, copy
from pathlib import Path
OUT=Path(__file__).with_name('site-editor.json')
REG='Europe & Middle East'
URL='rapid-medical.com/ous/therapies/lvo'
def toolbar(status='All changes saved', badge=('Live','success'), showing=None, publish_to='review', extra_right=None):
    show={'c':'button','v':'secondary','size':'s','text':f'Showing: {REG} ▾','to':'regions','quiet':True}
    if showing: show.update(showing)
    return {'c':'toolbar',
      'left':[{'c':'button','v':'ghost','text':'← Pages','to':'pages','quiet':True},{'c':'stack','gap':'xs','items':[{'c':'text','v':'strong','text':'Large vessel stroke'},{'c':'text','v':'caption','text':'Therapies · /ous/therapies/lvo'}]}],
      'center':[show],
      'right':[{'c':'badge','text':badge[0],'tone':badge[1],'dot':True},{'c':'text','v':'small','text':status},{'c':'iconbutton','icon':'↶','label':'Undo'},{'c':'iconbutton','icon':'↷','label':'Redo'},{'c':'button','v':'ghost','text':'Comment'},{'c':'button','v':'secondary','text':'Preview'},dict({'c':'button','v':'primary','text':'Publish'}, **({'to':publish_to,'quiet':True} if publish_to else {}))]}
HERO_TITLE='A patient-centric approach to AIS'
NEW_TITLE='A patient-centric approach to acute ischemic stroke'
HERO_TEXT='TIGERTRIEVER™ is the only active thrombectomy device – it is engineered to adapt to patient anatomy. Accelerate clot integration and reduce stress on the brain during mechanical thrombectomy procedures.'
def hero(title=HERO_TITLE, tw=None):
    h={'c':'section','tone':'dark','pad':'l','bg':'Background video · tigerface wide.mp4','items':[{'c':'stack','items':[
        {'c':'eyebrow','text':'Therapies / Large vessel stroke · US version · APAC version'},
        dict({'c':'heading','level':1,'text':title}, **(tw or {})),
        {'c':'text','v':'lead','text':HERO_TEXT}]}]}
    return h
def row1(**wrap):
    return {'c':'section','tone':'surface','items':[{'c':'grid','cols':'1.2fr 1fr','align':'center','items':[
        dict({'c':'media','kind':'video','label':'TIGERTRIEVER logo loop.mp4','ratio':'4/3'}, **wrap),
        {'c':'stack','items':[{'c':'eyebrow','text':'Gain active'},{'c':'heading','level':2,'text':'control'},{'c':'text','v':'muted','text':'Unlike conventional stent retrievers, active thrombectomy can improve clot penetration¹ and facilitate smooth retrieval with adjustable radial force.'}]}]}]}
def row2():
    return {'c':'section','tone':'surface','items':[{'c':'grid','cols':2,'align':'center','items':[
        {'c':'stack','items':[{'c':'eyebrow','text':'Accelerate'},{'c':'heading','level':2,'text':'thrombectomy'},{'c':'text','v':'muted','text':'Two million brain cells die every minute. TIGERTRIEVER™ saves minutes when removing the clot – with reported procedure times faster than the leading competitors.'}]},
        {'c':'media','kind':'video','label':'Tiger stair graph animated.mp4','ratio':'4/3'}]}]}
HEADER={'c':'siteheader','logo':'Rapid Medical','nav':['Therapies','Evidence','News','About','Careers'],'cta':'Get in touch'}
ADD_ROW={'c':'row','justify':'center','items':[{'c':'button','v':'secondary','size':'s','text':'+ Add section'}]}
CTA={'c':'cta','v':'band','title':'Questions?','text':'Reach out to learn more about our company and devices.','actions':[{'v':'primary','text':'Contact us'}]}

flow={
 'title':'Site editor — change a page and publish',
 'project':'Rapid Medical',
 'description':'Путь нетехнического редактора: найти страницу, поменять текст и видео прямо на ней, добавить секцию из готовых, проверить регионы, опубликовать и при ошибке вернуть версию. Основа: ADR-006 и findings/admin-editor-best-practices.md («Как должен выглядеть путь редактора»). Тексты страницы — с сайта, версия Europe & Middle East.',
 'start':'signin',
 'groups':[
   {'title':'1 · Найти страницу','screens':['signin','choose','pages']},
   {'title':'2 · Править на странице','screens':['page','edit-text','edit-video','add-section','section-added']},
   {'title':'3 · Регионы, публикация, откат','screens':['regions','review','published','history']}],
 'screens':[
  {'id':'signin','title':'Sign in','url':'rapid-medical.com/admin','height':620,'body':[
    {'c':'box','pad':'l','items':[{'c':'row','justify':'center','items':[{'c':'box','pad':'l','border':True,'items':[
      {'c':'heading','level':3,'text':'Rapid Medical'},{'c':'text','v':'muted','text':'Sign in to edit the website and the training tool.'},
      {'c':'input','label':'Email','value':'emily@rapid-medical.com'},{'c':'input','label':'Password','value':'••••••••••'},
      {'c':'button','v':'primary','text':'Sign in','full':True,'to':'choose','note':'После входа и кода 2FA — экран выбора, а не список системных разделов (находка №9).'}]}]}]}]},
  {'id':'choose','title':'Website or training tool','url':'rapid-medical.com/admin','height':620,'body':[
    {'c':'appbar','logo':'Rapid Medical','actions':[{'c':'avatar','name':'Emily R'}]},
    {'c':'box','pad':'l','gap':'l','items':[{'c':'heading','level':2,'text':'What do you want to work on?'},
      {'c':'grid','cols':2,'items':[
        {'c':'card','to':'pages','media':{'kind':'page','ratio':'16/9'},'title':'Website','text':'Pages, Evidence, News, Team, Jobs, Webinars','meta':'2 pages need your attention','note':'Два больших выбора вместо переключателя в сайдбаре: так просила владелица (находка №9).'},
        {'c':'card','media':{'kind':'image','label':'Training tool','ratio':'16/9'},'title':'Training tool','text':'TIGERTRIEVER courses, stages and videos','meta':'1 course in draft'}]}]}]},
  {'id':'pages','title':'Pages','url':'rapid-medical.com/admin/website','height':720,'body':[
    {'c':'appbar','logo':'Rapid Medical','nav':['Website','Training tool'],'active':0,'actions':[{'c':'avatar','name':'Emily R'}]},
    {'c':'split','cols':'220px minmax(0,1fr)','height':660,'items':[
      {'c':'sidebar','items':[{'label':'Pages','on':True,'badge':34},{'label':'Evidence','badge':102},{'label':'News','badge':53},{'label':'Team','badge':6},{'label':'Jobs'},{'label':'Webinars','badge':5},{'group':'Site'},{'label':'Media library'},{'label':'Menu and footer'}]},
      {'c':'box','pad':'l','gap':'l','items':[
        {'c':'row','justify':'between','items':[{'c':'heading','level':2,'text':'Pages'},{'c':'button','v':'primary','text':'New page'}]},
        {'c':'input','v':'search','placeholder':'Search pages, e.g. “Access” or “privacy”','note':'Частая задача «поменять текст на странице X» начинается с поиска, а не с дерева разделов.'},
        {'c':'alert','tone':'warning','title':'Needs your attention','text':'Large vessel stroke has unpublished changes from yesterday · Access: 1 picture has no description'},
        {'c':'list','items':[
          {'title':'Large vessel stroke','meta':'Therapies · All regions · edited yesterday by Svetlana P','badge':'Live, with unpublished changes','tone':'warning','thumb':'page','to':'page','note':'Миниатюра и статус обычными словами: «Live, with unpublished changes» вместо «Published, has edits».'},
          {'title':'Medium vessel occlusion','meta':'Therapies · Europe & Middle East, Asia & Pacific','badge':'Live','tone':'success','thumb':'page'},
          {'title':'Access','meta':'Therapies · All regions','badge':'Live','tone':'success','thumb':'page'},
          {'title':'About Us','meta':'All regions','badge':'Live','tone':'success','thumb':'page'},
          {'title':'DISTALS results','meta':'Evidence · All regions','badge':'Draft','thumb':'page'}]}]}]}]},
  {'id':'page','title':'The page, as visitors see it','url':URL,'height':900,'body':[
    toolbar(status='Last published yesterday'),
    HEADER,
    hero(title=HERO_TITLE, tw={'hover':True,'cursor':True,'to':'edit-text','note':'Страница выглядит как на сайте. Пунктир при наведении показывает, что можно поменять. Клик — правка на месте.'}),
    row1(), row2()],
   'notes':['Над страницей только: назад, название, регион, статус, отмена, комментарий, Preview и Publish (находка №4: было 9 элементов в два ряда).']},
  {'id':'edit-text','title':'Change the title in place','url':URL,'height':900,'body':[
    toolbar(status='Saving…',badge=('Live, with unpublished changes','warning')),
    HEADER,
    hero(title=NEW_TITLE, tw={'selected':True,'toolbar':[{'c':'text','v':'caption','text':'Title · same in all regions'},{'c':'button','v':'primary','size':'s','text':'Done','to':'edit-video'},{'c':'button','v':'ghost','size':'s','text':'Cancel'}],'toolbarPos':'below','note':'Текст правится прямо в заголовке. Шрифт, цвет и размер редактору недоступны: дизайн заперт (ADR-006).'}),
    row1(), row2()],
   'notes':['Сохранение автоматическое, в одной строке статуса: «Saving…» → «Saved. Not live yet». Посетители видят старую версию до Publish.']},
  {'id':'edit-video','title':'Replace a video: panel next to the page','url':URL,'height':900,'body':[
    toolbar(status='Saved. Not live yet',badge=('Live, with unpublished changes','warning')),
    {'c':'split','cols':'minmax(0,1fr) 380px','items':[
      {'c':'stack','gap':'xs','items':[HEADER, hero(title=NEW_TITLE), row1(selected=True)]},
      {'c':'panel','title':'Video','items':[
        {'c':'media','kind':'video','label':'TIGERTRIEVER logo loop.mp4','ratio':'16/9'},
        {'c':'row','gap':'s','items':[{'c':'button','v':'secondary','text':'Replace video'},{'c':'button','v':'ghost','text':'Remove'}]},
        {'c':'input','label':'Video description','value':'TIGERTRIEVER logo animation','hint':'Read aloud by screen readers'},
        {'c':'divider'},
        {'c':'switch','label':'Same in all regions','on':True,'note':'Регион наследует общее, пока его не поменяли (Shopify, Webflow). Выключил — видео станет своим для Europe & Middle East.'},
        {'c':'alert','tone':'info','text':'Change it here and it changes in Americas, Europe & Middle East and Asia & Pacific.'}],
       'actions':[{'c':'button','v':'primary','text':'Done','to':'add-section'}]}]}],
   'notes':['Гибрид, как у Storyblok и Shopify: короткий текст — на странице, медиа и скрытые поля — в панели рядом.']},
  {'id':'add-section','title':'Add a section from presets','url':URL,'height':900,
   'body':[toolbar(status='Saved. Not live yet',badge=('Live, with unpublished changes','warning')), HEADER, hero(title=NEW_TITLE), row1(), row2(), ADD_ROW],
   'overlay':{'c':'drawer','title':'Add a section','items':[
      {'c':'input','v':'search','placeholder':'Search sections'},
      {'c':'text','v':'small','text':'Sections use the site design. You change the text and pictures; layout and colours stay as they are.'},
      {'c':'grid','cols':2,'gap':'s','items':[
        {'c':'card','media':{'kind':'page','ratio':'4/3'},'title':'Text and media','text':'Text next to a picture or video'},
        {'c':'card','media':{'kind':'page','ratio':'4/3'},'title':'Key numbers','text':'Big numbers with labels'},
        {'c':'card','on':True,'media':{'kind':'page','ratio':'4/3'},'title':'Call to action','text':'Short text and a button','to':'section-added','note':'Пресеты — те же 22 блока, что уже в коде (src/blocks). Подписи — назначение, а не внутреннее имя.'},
        {'c':'card','media':{'kind':'page','ratio':'4/3'},'title':'Video','text':'A video with a title'},
        {'c':'card','media':{'kind':'page','ratio':'4/3'},'title':'Publications','text':'Studies from Evidence'},
        {'c':'card','media':{'kind':'page','ratio':'4/3'},'title':'Webinars','text':'Recordings from Webinars'}]}]}},
  {'id':'section-added','title':'The new section on the page','url':URL,'height':900,'body':[
    toolbar(status='Saved. Not live yet',badge=('Live, with unpublished changes','warning')),
    HEADER, hero(title=NEW_TITLE), row1(),
    dict(CTA, selected=True, toolbar=[{'c':'text','v':'caption','text':'Call to action'},{'c':'segmented','items':['Dark band','Grey band','Panel'],'active':0},{'c':'iconbutton','icon':'↑','label':'Move up'},{'c':'iconbutton','icon':'↓','label':'Move down'},{'c':'iconbutton','icon':'⧉','label':'Duplicate'},{'c':'iconbutton','icon':'✕','label':'Delete'}],
         note='Секция выделена: вариант, сдвиг, копия, удаление. Текст сразу правится кликом. Вариант выбирается из разрешённых дизайнером.'),
    row2(),
    {'c':'toast','float':True,'text':'Section added','action':'Undo'}],
   'links':[{'from':'section-added','to':'regions','label':'Showing ▾'}]},
  {'id':'regions','title':'Which region you are looking at','url':URL,'height':900,'body':[
    toolbar(status='Saved. Not live yet',badge=('Live, with unpublished changes','warning'),showing={'selected':True,'popover':[{'c':'menu','items':[
      {'title':'Showing'},{'label':'Americas','meta':'1 difference'},{'label':'Europe & Middle East','meta':'✓','on':True},{'label':'Asia & Pacific','meta':'2 differences'},'-',{'label':'See differences'}]}],
      'note':'Регион — одно меню над страницей, страница показана как в нём (Shopify Markets). Отличия считаются сами.'}),
    HEADER, hero(title=NEW_TITLE), row1(), CTA],
   'links':[{'from':'regions','to':'review','label':'Publish'}],
   'notes':['Регуляторные блоки (Indications and references) всегда свои в каждом регионе и не наследуются: правка одного региона не меняет показания в другом.']},
  {'id':'review','title':'Check before publishing','url':URL,'height':900,
   'body':[toolbar(status='Saved. Not live yet',badge=('Live, with unpublished changes','warning'),publish_to=None), HEADER, hero(title=NEW_TITLE), row1()],
   'overlay':{'c':'modal','wide':True,'title':'Publish Large vessel stroke','items':[
      {'c':'stepper','steps':['What changes','Checks','Publish'],'current':1},
      {'c':'heading','level':4,'text':'What changes'},
      {'c':'table','columns':['Change','Regions'],'rows':[['Title: “…approach to acute ischemic stroke”','All regions'],['Video in “Gain active control” — description added','All regions'],['New section: Call to action “Questions?”','Europe & Middle East']]},
      {'c':'heading','level':4,'text':'Checks'},
      {'c':'stack','gap':'s','items':[{'c':'checkbox','label':'Pictures and videos have descriptions','on':True},{'c':'checkbox','label':'Indications and references are unchanged','on':True},{'c':'checkbox','label':'Links on the page work','on':True}],'note':'Проверка перед публикацией списком галочек (Mailchimp). Видно, что и в каких регионах станет живым.'}],
    'actions':[{'c':'button','v':'ghost','text':'Back to the page','to':'regions'},{'c':'button','v':'primary','text':'Publish to 3 regions','to':'published'}]}},
  {'id':'published','title':'Live now','url':URL,'height':900,'body':[
    toolbar(status='Published just now',badge=('Live','success'),publish_to=None),
    {'c':'box','pad':'s','items':[{'c':'alert','tone':'success','title':'Live now','text':'rapid-medical.com/ous/therapies/lvo · also in Americas and Asia & Pacific','actions':[{'c':'link','text':'View live page ↗'},{'c':'button','v':'link','text':'History','to':'history'}],'note':'Публикация заканчивается адресом и ссылкой на живую страницу, а не надписью на 3 секунды (находка №8).'}]},
    HEADER, hero(title=NEW_TITLE), row1(), CTA]},
  {'id':'history','title':'History: go back to a version','url':URL,'height':900,
   'body':[toolbar(status='Published just now',badge=('Live','success'),publish_to=None), HEADER, hero(title=NEW_TITLE), row1()],
   'overlay':{'c':'drawer','title':'History','items':[
      {'c':'activity','items':[
        {'who':'Emily R','what':'published 3 changes','when':'Today, 10:42 · current version'},
        {'who':'Svetlana P','what':'published: new spec table','when':'Nov 8, 18:05','action':{'c':'row','gap':'s','items':[{'c':'button','v':'link','text':'Show changes'},{'c':'button','v':'secondary','size':'s','text':'Restore','note':'Откат одной кнопкой: ошибка после публикации не страшна (Fibery, «История с откатом»).'}]}},
        {'who':'Emily R','what':'published: hero video replaced','when':'Oct 30, 12:10','action':{'c':'row','gap':'s','items':[{'c':'button','v':'link','text':'Show changes'},{'c':'button','v':'secondary','size':'s','text':'Restore'}]}}]}]}}
 ]}
json.dump(flow, open(OUT,'w',encoding='utf8'), ensure_ascii=False, indent=1)
print('written', len(flow['screens']), 'screens')
