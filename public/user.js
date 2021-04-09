function loadPosts() {
    // $.get("/");
    $.get("/", (user_data) => {
        for (let data of user_data) {
            console.log("====================================");
            console.log(data);
            console.log("====================================");
            $("#posts-container").append(
                $(`
          <div class="col-4">
            <div class="card m-2">
              <div class="card-body">
                <h5 class="card-title">${data.username}</h5>
                <h6 class="card-subtitle mb-2 text-muted">${
                  p.user.username
                }</h6>
                <p class="card-text">
                  ${p.body.substr(0, 200)}
                  <a href="#">...read more</a>
                </p>
                <a href="#" class="card-link">Comment</a>
                <a href="#" class="card-link">Like</a>
              </div>
            </div>
          </div>
          
          `)
            );
        }
    });
}