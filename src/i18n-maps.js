// 새 맵 8개의 영어 (10/21 — Discovery 26-4 needs English + Korean): map names, furniture names and hiding-spot labels of
// 기차역 · 빌라 옥상 · 동네 도서관 · 바닷가 가게 · 곰제과 · 호수 섬 · 토순이 다락 · 아파트 현관 (gfx/*-props.js, stages.js).
// The main dictionary wins where it already has a line (addI18n only fills gaps).
import { addI18n } from './i18n.js';

addI18n({
  // maps
  '개굴이의 기차역': "Froggy's Train Station", '빌라 옥상 정원': 'Villa Rooftop Garden', '동네 도서관': 'Neighborhood Library',
  '냥냥이네 바닷가 가게': "Nyannyan's Seaside Shop", '곰제과': 'Bearie Bakery', '곰제과 앞마당': 'Bearie Bakery Front Yard',
  '옥탑방': 'Rooftop room', '옥탑방 문': 'Rooftop room door', '옥탑방 문 안': 'Inside the rooftop room door', '옥탑방 창턱': 'On the rooftop room window sill',
  '고무 대야 텃밭': 'Rubber tub garden', '빨간 대야 옆': 'Beside the red tub', '까만 대야 옆': 'Beside the black tub',
  '빨랫줄': 'Clothesline', '이불': 'Quilt', '이불 뒤': 'Behind the quilt', '빨래 기둥 깡통 위': 'On the clothesline post pail',
  '파라솔 자리': 'Parasol table', '파라솔 탁자 밑': 'Under the parasol table', '빨간 의자 더미 위': 'On the stack of red stools',
  '차체': 'Car body', '소화기함 위': 'On the fire box',
  '너굴이네 복층': "Rocky's Loft Studio", '레트로 오락기': 'Retro arcade cabinet', '오락기 아래 문': 'Arcade cabinet hatch', '오락기 아래 칸': 'In the arcade cabinet', '경품 나오는 곳': 'Prize chute',
  '브라운관 TV 세트': 'CRT TV set', 'TV장 서랍 안': 'In the TV stand drawer', 'TV 뒤': 'Behind the TV', 'TV장 위 게임 사이': 'Among the games on the TV stand',
  '만화책장': 'Comic shelf', '만화책장 위': 'On top of the comic shelf', '만화책장 앞 쌓인 책 뒤': 'Behind the comic pile', '빨간 만화책': 'Red comic book', '책장 뒤 비밀 칸': 'Secret niche behind the shelf',
  '피규어 진열장': 'Figure cabinet', '피규어 진열장 문': 'Figure cabinet doors', '피규어 진열장 가운데 칸': 'Middle shelf of the figure cabinet', '피규어 진열장 아래 칸': 'Bottom shelf of the figure cabinet', '피규어 진열장 위': 'On top of the figure cabinet',
  '서랍 계단': 'Drawer stairs', '계단 서랍 1': 'Stair drawer 1', '계단 서랍 2': 'Stair drawer 2', '계단 서랍 3': 'Stair drawer 3', '계단 서랍 4': 'Stair drawer 4',
  '계단 서랍 1칸': 'In stair drawer 1', '계단 서랍 2칸': 'In stair drawer 2', '계단 서랍 3칸': 'In stair drawer 3', '계단 서랍 4칸': 'In stair drawer 4', '계단 옆 숨은 칸': 'Hidden cubby in the stairs', '계단 앞 슬리퍼 옆': 'By the slippers at the stairs',
  '다락 바구니 도르래': 'Loft basket pulley', '도르래 바구니': 'Pulley basket', '도르래 바구니 안': 'In the pulley basket',
  '플라스틱 서랍장': 'Plastic drawers', '플라스틱 서랍 1칸': 'Plastic drawer 1', '플라스틱 서랍 2칸': 'Plastic drawer 2', '플라스틱 서랍 3칸': 'Plastic drawer 3',
  '게임 상자 선반': 'Game box shelf', '게임 선반 위': 'On the game shelf', '게임 선반 앞': 'In front of the game shelf', '벗어 둔 것들': 'Things left lying',
  '벗어 둔 후드티 밑': 'Under the dropped hoodie', '과자 봉지 밑': 'Under the snack bag', '꼬마전구': 'Fairy lights', '비 오는 창': 'Rainy window', '비 오는 창턱': 'On the rainy window sill', '애니 포스터': 'Anime poster', '오락실 코인': 'Arcade token',
  '너굴이 이불': "Raccoon's bed", '다락 둥지': 'Reading nest', '만화 벽 선반': 'Comic wall shelf', '액자 모음': 'Frames', '너굴이 인형 뒤': 'Behind the raccoon plush', '만화책 더미 뒤': 'Behind the comic pile', '방석 밑': 'Under the floor cushion', '만화책 탑 뒤': 'Behind the comic tower', '벽 선반 위': 'On the wall shelf', '방석': 'Floor cushion', '오락기 옆 틈': 'In the gap beside the arcade', '후드티': 'Hoodie',
  '개굴이의 호수 섬': "Froggy's Lake Island", '기차 객실': 'Train Carriage',
  '긴 벤치': 'Long bench', '벤치 밑': 'Under the bench', '벤치 위': 'On the bench', '벤치 서랍': 'Bench drawer', '벤치 서랍 안': 'In the bench drawer',
  '기차 창': 'Train window', '창턱': 'On the window ledge', '롤 블라인드': 'Roll blind', '블라인드 뒤 창턱': 'Behind the blind',
  '손잡이 봉과 짐 선반': 'Grab rail and luggage rack', '그물 짐 선반': 'Luggage net', '짐 선반 위': 'On the luggage rack',
  '연결문': 'Connecting door', '연결문 너머': 'Past the connecting door', '간식 카트': 'Snack cart', '간식 카트 뚜껑': 'Snack cart lid', '간식 카트 안': 'In the snack cart', '카트 아래 칸': 'On the cart\'s lower shelf', '토순이네 다락 놀이방': "Bunny's Attic Playroom", '우리 아파트 현관': 'Our Apartment: Lobby',

  // 기차역
  '기차': 'Train', '기차 앞 선로': 'On the track by the train', '건널목 차단기': 'Crossing gate', '차단기 아래': 'Under the crossing gate',
  '벚나무': 'Cherry tree', '벚나무 뒤': 'Behind the cherry tree', '벚나무 뿌리 사이': 'Between the cherry tree roots',
  '매표 창구': 'Ticket window', '창구 서랍': 'Ticket window drawer', '창구 서랍 안': 'In the ticket window drawer', '창구 선반': 'On the ticket window shelf',
  '코인 로커': 'Coin lockers', '코인 로커 칸': 'In a coin locker', '시간표 판': 'Timetable board', '시간표 판 뒤': 'Behind the timetable board',
  '우산꽂이': 'Umbrella stand', '우산꽂이 안': 'In the umbrella stand', '수돗가': 'Water tap', '수돗가 양동이 안': 'In the bucket by the tap', '수돗가 옆': 'By the water tap',
  '낚시 가방': 'Fishing bag', '낚시 가방 안': 'In the fishing bag', '물뿌리개': 'Watering can', '물뿌리개 옆': 'By the watering can',
  '플랫폼 의자': 'Platform seats', '승강장 쉼터': 'Platform shelter', '가방 더미': 'Pile of bags', '가방 옆': 'By the bags',
  '가방 위 바구니 안': 'In the basket on the bags', '바구니 뚜껑': 'Basket lid', '꽃 울타리': 'Flower fence', '꽃상자 사이': 'Between the flower boxes',

  // 호수 섬
  '큰 나무': 'Big tree', '큰 나무 뒤': 'Behind the big tree', '큰 나무 뿌리 사이': 'Between the big tree roots', '그루터기 옆': 'By the stump',
  '나무 구멍 문': 'Tree hollow door', '나무 구멍 안': 'In the tree hollow', '호수 데크': 'Lake deck', '데크 끝': 'At the end of the deck',
  '챔피언 의자 밑': "Under the champion's chair", '작은 보트': 'Little boat', '보트 덮개': 'Boat cover', '보트 안': 'In the boat',
  '바위 틈': 'In a crack in the rocks', '호숫가 오두막': 'Lakeside cottage', '오두막 문': 'Cottage door', '오두막 안': 'In the cottage',
  '창가 꽃상자': 'Window flower box', '화분 옆': 'By the flower pot', '등대 작은 섬': 'Lighthouse islet', '등대 문': 'Lighthouse door',
  '등대 안': 'In the lighthouse', '등대 섬 통 옆': 'By the barrel on the islet', '다리 밑': 'Under the bridge', '피크닉 세트': 'Picnic set',

  // 바닷가 가게
  '바닷가 가게': 'Seaside shop', '가게 문': 'Shop door', '진열 쇼케이스': 'Display case', '쇼케이스 안': 'In the display case',
  '진열창 앞 턱': 'On the ledge by the shop window', '발코니 화분 사이': 'Between the balcony pots', '물 위 데크': 'Deck over the water',
  '데크 밑': 'Under the deck', '기둥 뒤': 'Behind the post', '해산물 좌판': 'Seafood stall', '좌판 밑': 'Under the stall',
  '레몬 통 옆': 'By the lemon crate', '나무 통': 'Wooden barrels', '나무 통 뚜껑': 'Barrel lid', '나무 통 안': 'In the barrel',
  '파라솔 테이블': 'Parasol table', '파라솔 테이블 밑': 'Under the parasol table', '파라솔 테이블 위': 'On the parasol table',
  '칠판 메뉴판': 'Chalkboard menu', '칠판 뒤': 'Behind the chalkboard', '구명 튜브 시계': 'Life-ring clock',

  // 빌라 옥상
  '덩굴 난간': 'Ivy railing', '난간 아래': 'Under the railing', '텃밭 상자 옆': 'By the garden box',
  '방수포 짐': 'Tarp bundle', '전구 줄': 'String lights', '전구 기둥 밑': 'Under the light pole', '간식 상': 'Snack table', '풍선': 'Balloons', '상 밑': 'Under the table',

  // 동네 도서관
  '독서 다락': 'Reading nook', '다락 구석': 'In the nook corner', '다락 의자 위': 'On the nook seat', '아치 창': 'Arched window',
  '낮은 책장': 'Low bookcase', '낮은 책장 칸': 'In the low bookcase', '열람 책상': 'Reading table', '열람 책상 밑': 'Under the reading table',
  '열람 책상 위': 'On the reading table', '사서 책상': "Librarian's desk", '사서 책상 서랍': "Librarian's desk drawer",
  '사서 책상 서랍 안': "In the librarian's desk drawer", '사서 책상 위': "On the librarian's desk", '사서 의자 밑': "Under the librarian's chair",
  '반납함': 'Book drop', '반납함 문': 'Book drop door', '반납함 안': 'In the book drop', '책 수레': 'Book cart', '책 수레 아래 칸': 'On the book cart bottom shelf',
  '책장 뒤': 'Behind the bookcase', '책장 사다리': 'Library ladder', '사다리 옆': 'By the ladder',

  // 아파트 현관
  '유리 현관': 'Glass entrance', '유리문': 'Glass door', '유리문 뒤': 'Behind the glass door', '이삿짐 트럭': 'Moving truck',
  '트럭 밑': 'Under the truck', '트럭 짐칸 입구': 'At the back of the truck', '상자 더미': 'Pile of boxes', '상자 더미 위': 'On the pile of boxes',
  '이삿짐 상자 안': 'In a moving box', '손수레': 'Hand truck', '손수레 밑': 'Under the hand truck', '손수레 위': 'On the hand truck',
  '낮은 턱': 'Low ledge', '턱 안쪽': 'Behind the ledge', '턱 위': 'On the ledge', '발판 위': 'On the step', '자물쇠 상자': 'Padlocked box', '소화전함': 'Fire hose cabinet',

  // 토순이 다락
  '동그란 다락 창': 'Round attic window', '동그란 창틀 위': 'On the round window frame', '창가 의자': 'Window seat', '창가 의자 위': 'On the window seat',
  '창가 의자 왼쪽 서랍': 'Window seat left drawer', '창가 의자 오른쪽 서랍': 'Window seat right drawer', '티피 텐트': 'Teepee tent', '텐트 뒤': 'Behind the teepee',
  '흔들 목마': 'Rocking horse', '흔들 목마 밑': 'Under the rocking horse', '흔들 목마 안장': 'On the rocking horse saddle',
  '인형의 집': 'Dollhouse', '인형의 집 1층': "Dollhouse's first floor", '인형의 집 2층': "Dollhouse's second floor",
  '구름 러그': 'Cloud rug', '장난감 바구니': 'Toy basket', '장난감 바구니 안': 'In the toy basket', '바구니 담요': 'Basket blanket',
  '그림책 꽂이': 'Picture book rack', '그림책 꽂이 위': 'On the picture book rack', '그림책 뒤': 'Behind the picture books',
  '낮은 선반': 'Low shelf', '낮은 선반 위': 'On the low shelf', '낮은 선반 가운데칸': 'Low shelf middle', '낮은 선반 아래칸': 'Low shelf bottom',
  '쿠션 더미': 'Cushion pile', '큰 쿠션': 'Big cushion', '큰 쿠션 밑': 'Under the big cushion', '토끼 인형': 'Bunny plush', '토끼 인형 밑': 'Under the bunny plush',
  '공과 블록 사이': 'Between the ball and the blocks', '놀잇감 사이': 'Between the toys', '깃발 가랜드': 'Flag garland', '작은 액자': 'Little frames', '들보 그네': 'Beam swing',

  // 곰제과
  '곰제과 가게 정면': 'Bearie Bakery shopfront', '가게 문 앞 계단': 'On the shop step', '가게 앞 창': 'Shop front window', '진열 창 안': 'In the shop window',
  '창 턱 위': 'On the window ledge', '창 화분 상자': 'Window box', '깅엄 커튼 창': 'Gingham curtain window', '벽돌 화덕': 'Brick oven',
  '화덕 밑 장작 옆': 'By the firewood under the oven', '화구 아래 찬장': 'Under-oven cupboard', '개수대': 'Sink', '개수대 밑 찬장': 'Under-sink cupboard',
  '개수대 옆': 'By the sink', '반죽대': 'Baking counter', '반죽대 서랍': 'Baking counter drawer', '반죽대 위': 'On the baking counter',
  '반죽대 찬장': 'Baking counter cupboard', '아일랜드 조리대': 'Kitchen island', '조리대 왼쪽 서랍': 'Counter left drawer', '조리대 오른쪽 서랍': 'Counter right drawer',
  '조리대 찬장': 'Counter cupboard', '냄비 걸이': 'Pot rail', '병 선반': 'Jar shelf', '위 병 선반': 'Upper jar shelf', '아래 병 선반': 'Lower jar shelf',
  '팬케이크 옆': 'By the pancakes', '밀가루 포대': 'Flour sacks', '밀가루 포대 뒤': 'Behind the flour sacks',
  '빵 바구니': 'Bread basket', '빵 바구니 안': 'In the bread basket', '빵 바구니 천': 'Bread basket cloth', '바게트 바구니 안': 'In the baguette basket', '바게트 바구니 천': 'Baguette basket cloth',
  '빵 벽 선반': 'Bread wall rack', '빵 선반 둘째 칸': 'Bread rack second shelf', '빵 선반 셋째 칸': 'Bread rack third shelf', '빵 상자 사이': 'Between the bread crates',
  '빵 식힘 수레': 'Bread cooling cart', '식힘 수레 둘째 칸': 'Cooling cart second shelf', '식힘 수레 셋째 칸': 'Cooling cart third shelf',
  '빵 좌판': 'Bread stall', '빵 좌판 밑': 'Under the bread stall', '좌판 천': 'Stall cloth', '빵 진열대': 'Bread display',
  '빵 진열장 가운데 칸': 'Bread case middle shelf', '빵 진열장 아래 칸': 'Bread case bottom shelf', '빵 진열장 문': 'Bread case door', '빵 진열장 서랍': 'Bread case drawer',
  '진열대 위': 'On the display', '진열대 위 칸': 'Display top shelf', '진열대 아래 칸': 'Display bottom shelf', '진열대 뒤 미닫이': 'Sliding door behind the display',
  '계산대 서랍': 'Register drawer', '나무 상자 뚜껑': 'Crate lid', '나무 상자 안': 'In the crate', '사과 상자 위': 'On the apple crate',
  '등불 기둥': 'Lamp post', '등불 기둥 뒤': 'Behind the lamp post', '오늘의 빵 메뉴판': "Today's bread menu", '창가 부스': 'Window booth',
  '부스 의자 위': 'On the booth seat', '부스 테이블 밑': 'Under the booth table', '부스 테이블 위': 'On the booth table',
  '카페 식탁': 'Café table', '왼쪽 의자 위': 'On the left chair', '오른쪽 의자 위': 'On the right chair', '접이식 의자 위': 'On the folding chair',
  // 20판 옥상 3차 (⑥ 10/21)
  '고추 말리기': 'Drying chillies', '소쿠리': 'Basket', '소쿠리 밑': 'Under the basket', '고추 돗자리 앞': 'In front of the chilli mat',
  '옥상 수도': 'Rooftop tap', '파란 양동이 안': 'In the blue bucket', '수도 옆': 'Beside the tap', '데크 화분 줄': 'Deck pots', '화분 줄 앞': 'In front of the pots',
  // 27판 벚꽃마을역 station4 · 28판 봄빛 로컬 전차 traincar5 · 30판 바닷가 가게 2 seaside2 (⑧ 10/24 — 부품·숨김 자리 이름)
  '벚꽃마을역': 'Sakura Town Station', '나무 역사': 'Wooden station house', '승강장 지붕': 'Platform roof', '간이 개찰기': 'IC card gate',
  '개찰기 옆': 'Beside the card gate', '물품 보관함': 'Coin lockers', '물품 보관함 안': 'In the coin locker', '물품 보관함 위': 'On the coin lockers',
  '역 이름판': 'Station sign', '역 이름판 밑': 'Under the station sign', '역사 처마 밑': 'Under the station eaves', '파스텔 전철': 'Pastel train',
  '짐 카트': 'Luggage cart', '짐 카트 옆': 'Beside the luggage cart', '짐 카트 위': 'On the luggage cart', '우체통': 'Mailbox', '우체통 뒤': 'Behind the mailbox',
  '꽃밭 속': 'In the flower bed', '문 옆 화분': 'Pot by the door', '벚나무 밑': 'Under the cherry tree', '선로 옆': 'Beside the track',
  '승강장 의자 밑': 'Under the platform bench', '승강장 의자 위': 'On the platform bench', '쓰레기통 옆': 'Beside the bins', '쓰레기통 위': 'On the bins',
  '울타리 밑': 'Under the fence', '자전거 옆': 'Beside the bikes', '전봇대 밑': 'At the foot of the pole', '낚시 가방 옆': 'Beside the fishing bag',
  '봄빛 로컬 전차': 'Spring Local Train', '청록 로컬 전차': 'Teal local train', '레트로 노면 전차': 'Retro streetcar',
  '운전실': 'Driver\'s cab', '운전석 위': 'On the driver\'s seat', '운전대 위': 'On the controls', '운임함 위': 'On the fare box',
  '롱시트': 'Long seat', '박스석': 'Box seats', '좌석 위': 'On the seat', '좌석 서랍': 'Seat drawer', '좌석 서랍 안': 'In the seat drawer', '창가 탁자 위': 'On the window table',
  '짐 선반': 'Luggage rack', '짐 선반 여행 가방': 'Suitcase on the rack', '여행 가방 뒤': 'Behind the suitcase', '배낭': 'Backpack', '배낭 뒤': 'Behind the backpack',
  '손잡이 봉': 'Grab pole', '하차 벨': 'Stop button', '정리권 발권기': 'Ticket dispenser', '발권기 위': 'On the ticket dispenser',
  '출입문': 'Train door', '출입문 발판': 'Door step', '연결 통로': 'Gangway', '고무 주름막': 'Rubber bellows', '주름막 사이': 'Between the bellows',
  '칸 벽': 'Car wall', '칸 끝벽': 'Car end wall', '바닥 짐': 'Bags on the floor', '짐 위': 'On the bags',
  '짐칸': 'Cargo corner', '짐칸 문': 'Cargo door', '짐칸 안': 'In the cargo corner', '전망석': 'Viewing seat', '전망석 위': 'On the viewing seat', '전망석 밑': 'Under the viewing seat', '꼬리 난간': 'Tail railing',
  '깃발 데크': 'Flag deck', '바닷가 풍경': 'Seaside view', '나무 통 위': 'On the barrel', '모래성 옆': 'Beside the sandcastle',
  '보트 덮개 밑': 'Under the boat cover', '생선 상자 위': 'On the fish crate', '통발 안': 'In the fish trap',
});
